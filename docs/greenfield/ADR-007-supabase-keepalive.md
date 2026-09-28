# ADR-007: กัน Supabase free tier pause

- สถานะ: Accepted
- วันที่: 2026-09-28
- เกี่ยวข้อง: ADR-005 (cron secret), migration `07-keepalive.sql`

## บริบท

- Supabase free plan จะ **pause โปรเจกต์ที่ไม่มี activity 7 วัน**; เมื่อ pause แล้ว API และฐานข้อมูลหยุดทั้งหมด หน้า quiz บันทึกไม่ได้ และต้องกด restore เองใน dashboard
- โปรเจกต์ที่ pause นานเกินกำหนดของ Supabase (ปัจจุบันราว 90 วัน) อาจ restore จาก dashboard ไม่ได้ เหลือทางเดียวคือดาวน์โหลด backup
- แคมเปญมีช่วงเงียบ (หลังจบกิจกรรม, ช่วงวันหยุด) ที่ไม่มีผู้เล่นเลยหลายวัน
- ถ้าคำถามอยู่ใน cache (ADR-003) หน้าเว็บยังเปิดได้ แต่ส่วนที่เขียนข้อมูลจะเงียบจนไม่มีใครสังเกต

## ตัวเลือก

| ตัวเลือก | ข้อดี | ข้อเสีย | ผล |
| --- | --- | --- | --- |
| Vercel Cron | อยู่กับแอป, ส่ง `Authorization: Bearer $CRON_SECRET` ให้เอง, ไม่มีบัญชีเพิ่ม | ทำงานเฉพาะ Production deployment; Hobby รันได้วันละครั้งและเวลาคลาดในชั่วโมง; ถ้า deploy พังหรือ env หาย ก็หยุดด้วย | **หลัก** |
| GitHub Actions schedule | อิสระจาก Vercel, ยิงฐานข้อมูลตรงได้, กดรันเองได้ | schedule อาจล่าช้า; GitHub ปิด scheduled workflow ของ public repo ที่ไม่มี activity 60 วัน | **สำรอง** |
| External uptime pinger (UptimeRobot, cron-job.org) | ตั้งง่าย มีแจ้งเตือน | ต้องส่ง custom header ได้และต้องฝาก secret ไว้กับบริการภายนอก; ping `/api/health` ไม่แตะ DB จึงไม่นับ | ใช้เฝ้า `/api/health` เท่านั้น |
| pg_cron ภายในฐานข้อมูล | ไม่ต้องพึ่งอะไรภายนอก | Supabase ไม่ได้ระบุว่านับงานภายในเป็น activity (งานไม่ผ่าน API gateway) และเมื่อ pause แล้ว pg_cron ก็หยุดด้วย จึงปลุกตัวเองไม่ได้ | ไม่ใช้เพื่อ keep-alive (ใช้กับ retention purge ใน ADR-006) |
| อัปเกรดเป็น Supabase Pro | ไม่ pause เลย, มี backup รายวัน | มีค่าใช้จ่ายรายเดือน | แนะนำเมื่อแคมเปญเป็นทางการระยะยาว |

## การตัดสินใจ

**Vercel Cron รายวัน (หลัก) + GitHub Actions ทุก 2 วัน (สำรอง) ที่ยิงได้ทั้ง app route และ Supabase REST ตรง**

```text
Vercel Cron  17 3 * * * (10:17 น.)  ─┐
                                      ├─> GET /api/cron/keepalive ──> rpc keepalive_ping() ──> upsert public.keepalive
GitHub Actions 23 1 */2 * * (08:23 น.)┤        (Bearer CRON_SECRET)       (service role)
                                      └─> POST {SUPABASE_URL}/rest/v1/rpc/keepalive_ping  (ขั้นที่ 2, ไม่บังคับ)
```

- **ฐานข้อมูล** (`supabase/migrations/07-keepalive.sql`): ตาราง `public.keepalive` แถวเดียว (`id = 1`, `last_ping_at`, `ping_count`), RLS เปิดโดยไม่มี policy, revoke จาก `anon` / `authenticated`; function `keepalive_ping()` (`security definer`, `search_path = ''`) upsert แล้วคืนเวลา, execute ได้เฉพาะ `service_role`. การเขียนจริงผ่าน API gateway จึงนับเป็น activity แน่นอน
- **Route** (`app/api/cron/keepalive/route.ts`): `runtime = "nodejs"`, `force-dynamic`; ตรวจ `verifyCronRequest()` (constant-time, secret ≥ 16 ตัว, fail closed); ตอบ `no-store`:
  - `200 { ok: true, pingedAt }`
  - `401 { ok: false, error: "unauthorized" }`: header ไม่ตรงหรือ `CRON_SECRET` ไม่ได้ตั้ง/สั้นเกิน
  - `503 { ok: false, error: "not_configured" }`: ไม่มี `NEXT_PUBLIC_SUPABASE_URL` หรือ `SECRET_KEY`
  - `503 { ok: false, error: "db_unavailable" }`: pause อยู่, กำลัง restore, ยังไม่ apply 07 หรือเครือข่ายล่ม
- `proxy.ts` ยกเว้น `api/cron` และ `api/health` จาก matcher: ไม่มีการเรียก Supabase Auth เพิ่ม
- **Vercel** (`vercel.json`): `{ "path": "/api/cron/keepalive", "schedule": "17 3 * * *" }` (UTC)
- **GitHub** (`.github/workflows/supabase-keepalive.yml`): `23 1 */2 * *` + `workflow_dispatch`, timeout 5 นาที, `concurrency` กลุ่มเดียว, `permissions: contents: read`
  - ขั้น 1: เรียก app route ด้วย `KEEPALIVE_URL` + `CRON_SECRET` (retry 3 ครั้ง)
  - ขั้น 2: เรียก `rpc/keepalive_ping` ตรงด้วย `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (key แบบ JWT ใส่ทั้ง `apikey` และ `Authorization`, `sb_secret_` ใส่เฉพาะ `apikey`)
  - แต่ละขั้นข้ามเองเมื่อไม่มี secret; job fail เฉพาะเมื่อไม่มีขั้นใดสำเร็จ และเตือนเมื่อ app route ล้ม
- ช่องว่างสูงสุดระหว่าง ping เมื่อทั้งสองทางทำงาน ≈ 1 วัน; เมื่อ Vercel ล้มอย่างเดียว ≈ 2 วัน; ยังต่ำกว่า 7 วันมาก

## Runbook

### ตั้งค่าครั้งแรก

1. Apply `07-keepalive.sql` (SQL editor หรือ `supabase db push`)
2. Vercel → Environment Variables (Production): `CRON_SECRET` จาก `openssl rand -hex 32`, `SECRET_KEY`, `NEXT_PUBLIC_SUPABASE_URL` แล้ว redeploy (cron อ่าน `vercel.json` ตอน deploy)
3. GitHub → Settings → Secrets and variables → Actions: `KEEPALIVE_URL`, `CRON_SECRET` (ค่าเดียวกัน); ถ้าต้องการขั้น 2 เพิ่ม `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
4. GitHub → Actions → "Supabase keep-alive" → Run workflow

### ตรวจว่าทำงาน

- `curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://<โดเมน>/api/cron/keepalive` ต้องได้ `{"ok":true,"pingedAt":"…"}`; ไม่ใส่ header ต้องได้ 401
- SQL: `select last_ping_at, ping_count, now() - last_ping_at as age from public.keepalive;`
- Vercel → Project → Settings → Cron Jobs: ดู log ของแต่ละรอบ
- GitHub run log บรรทัด verdict: `app route: success | direct rpc: success`

### เมื่อโปรเจกต์ถูก pause แล้ว

1. ping ใด ๆ ปลุกโปรเจกต์ที่ pause ไม่ได้ (route จะตอบ `503 db_unavailable`): เข้า Supabase dashboard → project → **Restore**
2. รอจน status เป็น healthy แล้ว Run workflow เองหนึ่งครั้ง และ curl route ตามด้านบน
3. ตรวจ pg_cron กลับมาทำงาน: `select jobname, schedule, active from cron.job;` (`pdpa-retention-purge` ใช้ cutoff ตามเวลา จึงตามเก็บงานที่ค้างได้ในรอบถัดไป)
4. หาสาเหตุ: `CRON_SECRET` เปลี่ยน/หาย, deployment production ล้ม, workflow ถูก GitHub ปิด (เปิดใหม่ในแท็บ Actions), secret ของ GitHub หมดอายุ
5. ถ้า pause เกินระยะที่ restore ได้: ดาวน์โหลด backup จาก dashboard แล้วกู้ในโปรเจกต์ใหม่ (ต้องแก้ env ทุกที่)

## Monitoring

| สิ่งที่เฝ้า | วิธี | เกณฑ์แจ้งเตือน |
| --- | --- | --- |
| heartbeat ในฐานข้อมูล | `public.keepalive.last_ping_at` | เก่ากว่า 3 วัน |
| GitHub workflow | อีเมลแจ้ง workflow ล้มของ GitHub (ค่าเริ่มต้นส่งถึงผู้ที่แก้ schedule ล่าสุด) | run ล้ม 1 ครั้ง |
| Vercel Cron | log ใน Cron Jobs / Runtime Logs ค้นหา `[cron/keepalive]` | มี 401/503 |
| แอปยังเสิร์ฟ | uptime monitor ภายนอกยิง `GET` หรือ `HEAD /api/health` | ล่ม > 5 นาที |
| Supabase | อีเมลแจ้งเตือนของ Supabase ถึงเจ้าของ organization | ได้รับอีเมลเรื่อง inactivity |

## ผลที่ตามมา

- ข้อดี: สองทางอิสระต่อกัน ทางหนึ่งยังยิงฐานข้อมูลได้แม้แอปพัง
- ข้อดี: route ปลอดภัย (secret, constant-time, no-store) และไม่เปิดเผยรายละเอียด error
- ข้อเสีย: ต้องดูแล secret สองที่ (Vercel + GitHub) ให้ตรงกัน และหมุนพร้อมกัน (ADR-005)
- ข้อเสีย: เป็นการเลี่ยงนโยบาย free tier ไม่ใช่การรับประกัน; ถ้าแคมเปญสำคัญต่อหน่วยงาน ให้ใช้ Supabase Pro แทน แล้วคง route นี้ไว้เป็น health check ของฐานข้อมูล
