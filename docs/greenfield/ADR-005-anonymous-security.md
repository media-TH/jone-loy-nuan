# ADR-005: ความปลอดภัยสำหรับผู้ใช้นิรนาม

- สถานะ: Accepted (มีงานค้าง: ดู "ขั้นต่อไป")
- วันที่: 2026-09-28
- เกี่ยวข้อง: ADR-006 (PDPA), ADR-007 (cron secret)

## บริบท

- ผู้เล่นไม่สมัครสมาชิก แต่ต้องมีตัวตนนิรนามเพื่อ: บันทึกคำตอบของรอบเดียวกัน, ผูกความยินยอม, และยืนยันตัวเมื่อขอลบข้อมูล
- staff ใช้ Supabase Auth (อีเมล + รหัสผ่าน) เข้า `/mgmt-portal`
- เว็บเป็นของหน่วยงานรัฐและเป็นเรื่องมิจฉาชีพ จึงเป็นเป้าของการปลอมหน้าเว็บ, สแปมสถิติ และการเปิดเผยข้อมูล

### กลไก anon JWT ปัจจุบัน

1. client `POST {}` ไป `${NEXT_PUBLIC_SUPABASE_URL}/functions/v1/issue-anon-jwt` (`lib/services/anon-jwt.service.ts`)
2. Edge Function (`supabase/functions/issue-anon-jwt/index.ts`, deploy ด้วย `--no-verify-jwt`, CORS `*`) rate limit 10 ครั้ง/ชั่วโมง ในหน่วยความจำ keyed ด้วยค่า `x-forwarded-for` ดิบ
3. สุ่ม UUID ใหม่ทุกครั้ง (ไม่อ่าน body จึงไม่มีทางขอ token ของ id อื่น) แล้วเซ็น HS256 ด้วย `SECRET_KEY` หรือ `ANON_JWT_SECRET` (project JWT secret) เท่านั้น
4. claims: `{ sub, role: "authenticated", anon_user_id, iat, exp = iat + TOKEN_TTL_SECONDS }` (ค่าเริ่มต้น 86400, บีบให้อยู่ระหว่าง 300–86400) ไม่มี `aud` / `iss`
5. client เก็บใน `sessionStorage` (`anon_jwt_cache`) และส่งเป็น `Authorization: Bearer`; แอปไม่ตรวจเอง PostgREST เป็นผู้ตรวจลายเซ็น
6. RLS (migration 05/06, 08) ให้อ่าน/เพิ่ม/แก้เฉพาะแถวที่ `anonymous_user_id` ตรงกับ claim (รองรับทั้ง `<id>` และ `user_<id>`)

**จุดอ่อน**

- (แก้แล้ว) เดิมรับ `requested_anon_id` จาก client ทำให้ขอ token ของ id ใดก็ได้ ซึ่งร่วมกับ view `quiz_kpi_summary` ที่เปิดเผย id ทำให้ลบข้อมูลของผู้อื่นได้ ตอนนี้ id สุ่มฝั่ง server เสมอ และ migration 10 ปิด view นั้น
- role ของผู้เล่นคือ `authenticated` เท่ากับ staff: policy ใด `to authenticated` ที่ตั้งใจให้ staff จะเปิดให้ทุกคนที่ขอ token ได้
- คะแนนมาจาก client: `isCorrect` ของทุกคำตอบถูกส่งไปกับเนื้อหา quiz (`Question.answers[]`) และ client นับเอง; `QuizService.updateSession()` เขียน `correct_answers` จาก browser ตรงไป PostgREST และ `saveQuizResponse()` (`lib/actions/quiz.ts`) คำนวณ `total_summary_score` จาก `correct_answers` ที่ client ส่ง
- rate limit เลี่ยงง่าย (เปลี่ยน header ได้, state หายเมื่อ instance ใหม่)
- (แก้แล้ว) ตัด fallback ไปเซ็นด้วย `SUPABASE_SERVICE_ROLE_KEY` ซึ่งเป็น secret ผิดประเภท

## Threat model (STRIDE-lite)

| # | STRIDE | ภัย | ผลกระทบ | Control ปัจจุบัน | ความเสี่ยงคงเหลือ |
| --- | --- | --- | --- | --- | --- |
| T1 | Spoofing | ขอ token ในนาม id ของคนอื่น | อ่าน/แก้ผลของคนอื่น, ลบข้อมูลคนอื่น | id สุ่มไม่เปิดเผยที่ไหน, RLS ต่อแถว, `pdpa_current_subject()` ตรวจผ่าน PostgREST | กลาง |
| T2 | Spoofing | open redirect หลัง login (`redirectTo`) ใช้ทำ phishing | หลอกผู้ดูแลไปเว็บปลอม | มี `safeRedirectPath()` (`lib/security/safe-redirect.ts`) แต่**ยังไม่ต่อ**ใน `app/(main)/login/action.ts` และ `login/page.tsx` | สูง (แก้ง่าย) |
| T3 | Tampering | ส่ง `correct_answers` / คะแนนปลอม | สถิติ KPI ที่รายงานต่อ ธปท. เพี้ยน | validate ช่วงตัวเลขใน `saveQuizResponse()` (0 ≤ ถูก ≤ ทั้งหมด) | สูง |
| T4 | Tampering | XSS ขโมย token จาก `sessionStorage` | สวมรอยในรอบนั้น | React escape, `<JsonLd>` escape `< > &`, `isSafeAssetSrc()`, CSP `object-src 'none'`, `base-uri 'self'` | กลาง (`script-src 'unsafe-inline'`) |
| T5 | Repudiation | ปฏิเสธว่าเคย/ไม่เคยให้ความยินยอม | ข้อพิพาท PDPA | `pdpa_consent_log` append-only, `created_at` จาก DB clock (migration 08) | ต่ำ |
| T6 | Info disclosure | เรียก `/api/analytics/*` โดยไม่ login | ข้อมูลสถิติ/ประชากรรั่ว | `requireAdmin()` 401/403/503 + `no-store`, ไม่ส่งรายละเอียด error | ต่ำ |
| T7 | Info disclosure | อ่านคำถามของ quiz ที่ยัง draft ผ่าน RPC | แคมเปญรั่วก่อนเปิด | ไม่มี (ADR-003) | ต่ำ–กลาง |
| T8 | Info disclosure | service key หลุดไป client | bypass RLS ทั้งหมด | `import "server-only"` ใน `utils/supabase/admin.ts`, ชื่อ env ไม่มี `NEXT_PUBLIC_` | ต่ำ |
| T9 | DoS | ยิง issue-anon-jwt / Server Actions / สร้าง session รัว ๆ | quota free tier หมด, ตารางบวม | rate limit in-memory (Edge 10/ชม., privacy actions `lib/privacy/rate-limit.ts`) | สูง |
| T10 | DoS | Supabase ช้าจนทุกหน้าค้าง | เว็บล่ม | proxy timeout 3s / fetch 2.5s, ผู้เยี่ยมชมนิรนามไม่เรียก Auth เลย (`utils/supabase/middleware.ts`) | ต่ำ |
| T11 | Elevation | สมัคร Supabase Auth เองแล้วเข้า portal | แก้เนื้อหา, ดูข้อมูลทั้งหมด | `ADMIN_EMAILS` + ห้าม anonymous user (`lib/security/admin-policy.ts`) **เฉพาะ API routes**; layout ของ portal ตรวจแค่ `auth.getUser()` | สูง ถ้า sign-up เปิดอยู่ |
| T12 | Elevation | ตารางที่ไม่มี RLS ใน migrations (`questions`, `answers`, `survey_responses`, `kpi_targets`, `scenario_images`) | ถ้า production ไม่เปิด RLS: เขียน/อ่านได้ด้วย public key | ไม่ทราบสถานะ production | ต้อง audit |
| T13 | Clickjacking / framing | ฝังเว็บใน iframe ปลอม | หลอกกด | `frame-ancestors 'none'` + `X-Frame-Options: DENY` (production) | ต่ำ |

## Controls ที่ทำแล้ว

- **Security headers ทุก response** (`lib/security/csp.ts` ผ่าน `next.config.ts`):
  - CSP: `default-src 'self'`; `script-src 'self' 'unsafe-inline'` (+ `'unsafe-eval'` เฉพาะ dev); `connect-src` เฉพาะ self, `*.supabase.co` (https/wss) และ Vercel vitals; `img-src` self/data/blob/Supabase และ `images.ctfassets.net` เมื่อตั้ง `CONTENTFUL_SPACE_ID` (ส่วน `images.remotePatterns` จำกัดถึงระดับ space); `frame-ancestors 'none'`; `form-action 'self'`; `object-src 'none'`; `upgrade-insecure-requests`
  - HSTS 2 ปี + preload, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` ปิด camera/mic/geolocation/browsing-topics, `COOP: same-origin`, `poweredByHeader: false`
  - preview deployment อนุญาต Vercel Toolbar (`vercel.live`); dev ผ่อน CSP และไม่ส่ง HSTS/XFO
- **server-only**: `utils/supabase/admin.ts`, `lib/security/require-admin.ts`, `lib/content/supabase-source.ts`, `lib/privacy/identity.ts`, `lib/privacy/consent-log.ts`
- **Admin-gated APIs**: `requireAdmin()` ตรวจ session ด้วย `auth.getUser()`, ปฏิเสธ anonymous user, ใช้ allowlist `ADMIN_EMAILS`; ตอบ JSON `no-store` + ข้อความไทย
- **Cron auth**: `Authorization: Bearer $CRON_SECRET` เทียบแบบ constant-time (SHA-256 + `timingSafeEqual`), secret < 16 ตัว = ไม่ตั้งค่า (fail closed) (`lib/security/cron-auth.ts`)
- **zod** ทุก input ของ `lib/actions/privacy.ts` และ `lib/actions/survey.ts` (option list ปิด), `lib/content/schema.ts` สำหรับเนื้อหา
- **ยืนยันตัวตนด้วยฐานข้อมูล**: Server Action ไม่ decode JWT เอง ส่ง token ไปเรียก `pdpa_current_subject()` ให้ PostgREST ตรวจลายเซ็นและวันหมดอายุ (`lib/privacy/identity.ts`)
- **RLS / grants**: 05/06 (session/คำตอบของตัวเอง), 07 (`keepalive` ไม่มี policy + revoke), 08 (consent log append-only, ถอนสิทธิ์เขียน `survey_responses` จาก anon/authenticated, function PDPA ให้ `service_role` เท่านั้น), 09 (`quizzes` อ่านได้เฉพาะ published)
- **อื่น ๆ**: `images.remotePatterns` จำกัด Contentful ตาม space และ ngrok เฉพาะ dev; `/api/health` ไม่แตะ DB ไม่เปิดเผย env

## ขั้นต่อไป (เรียงตามลำดับ)

| # | งาน | แก้ภัย | Effort |
| --- | --- | --- | --- |
| 1 | ~~ต่อ `safeRedirectPath()` ใน `login/action.ts` และ `login/page.tsx`~~ ทำแล้ว | T2 | XS (ชั่วโมง) |
| 2 | ปิด "Allow new users to sign up" ใน Supabase Auth และตั้ง `ADMIN_EMAILS` (production บังคับแล้ว: ไม่ตั้ง = ไม่มีใครเป็น admin); `getAdminUser()` ใน layout และ admin Server Actions ทำแล้ว, ลบ `signup` action แล้ว | T11 | XS |
| 3 | Audit RLS production: `select relname, relrowsecurity from pg_class where relnamespace = 'public'::regnamespace;` แล้วเขียน migration ปิดช่อง; dump function ที่มีเฉพาะ production (`create_quiz_session`) เข้า repo | T12 | S |
| 4 | ~~ตรวจ path Edge Function~~ แก้เป็น `/functions/v1/` ตามเอกสาร Supabase แล้ว | ความพร้อมใช้งาน | XS |
| 5 | Vercel Firewall: rate limit rule สำหรับ POST (Server Actions) และ `/api/*` ตาม IP; เปิด Attack Challenge Mode เมื่อถูกยิง | T9 | S (ตรวจ plan) |
| 6 | **Supabase Anonymous Sign-Ins** (`signInAnonymously()`) + CAPTCHA (Cloudflare Turnstile) แทน issue-anon-jwt: token ออกโดย Supabase Auth, มี claim `is_anonymous`, RLS ใช้ `auth.uid()`, staff แยกด้วย `is_anonymous = false`; ย้าย `anonymous_user_id` เดิมแบบคู่ขนาน | T1, T9, T11 | M–L (3–5 วัน) |
| 7 | คิดคะแนนบน server: client ส่งเฉพาะ answer id, server เทียบกับ `getQuiz()` หรือ SQL function แล้วเขียนเอง | T3 | M (2–3 วัน) |
| 8 | Nonce CSP ผ่าน `proxy.ts` ตัด `'unsafe-inline'`; แลกกับการที่หน้าต้อง render แบบ dynamic (เสีย SSG/ISR) จึงพิจารณาเฉพาะหน้าที่เป็น dynamic อยู่แล้ว หรือใช้ hash/SRI | T4 | M |
| 9 | Key rotation: หมุน `SECRET_KEY`, `CRON_SECRET`, secret ของ Edge Function ทุก 6–12 เดือนหรือเมื่อคนออก; ย้ายไป Supabase JWT signing keys (asymmetric) + API keys แบบ `sb_publishable_` / `sb_secret_`; การหมุน legacy JWT secret ทำให้ anon token ทั้งหมดใช้ไม่ได้ (อายุ ≤ 24 ชม. ยอมรับได้) | T8 | S ต่อรอบ |
| 10 | ใส่ `aud` / `iss` ใน token และลด TTL เหลือ 2–4 ชม. (ถ้ายังไม่ทำข้อ 6) | T1, T4 | XS |

## ผลที่ตามมา

- ข้อดี: ภัยที่รุนแรงที่สุดต่อผู้ใช้ทั่วไป (ข้อมูลรั่ว, framing, API สถิติเปิด) ถูกปิดแล้วโดยไม่เปลี่ยน flow ของผู้เล่น
- ข้อเสีย: ความถูกต้องของสถิติยังขึ้นกับ client จนกว่าจะทำข้อ 6–7; ให้ระบุข้อจำกัดนี้เมื่อรายงานตัวเลข
- ข้อเสีย: `'unsafe-inline'` ยังอยู่ใน `script-src` เพื่อคง static rendering
