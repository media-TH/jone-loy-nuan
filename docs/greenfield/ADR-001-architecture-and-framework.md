# ADR-001: Framework, rendering strategy และโครงสร้างโค้ด

- สถานะ: Accepted
- วันที่: 2026-09-28
- เกี่ยวข้อง: ADR-002 (motion), ADR-003 (content), ADR-004 (SEO)

## บริบท

- ผู้ใช้คือคนไทยทั่วไป ส่วนใหญ่ใช้มือถือ รวมถึงผู้สูงอายุ และเปิดผ่าน in-app browser ของ LINE / Facebook บ่อย
- งานของเว็บมีสองแบบ: (1) เนื้อหาอ่าน/ค้นหาได้ (landing, `/learn`, `/privacy`) ต้อง SEO ดีและโหลดเร็ว (2) quiz 10 ข้อที่ interactive มี motion และ state ข้ามหลายหน้าจอ
- ระบบเดิม: Next.js 16.1 App Router + React 19.2 + Tailwind v4 + Supabase บน Vercel (`package.json`), ทีมถนัด React/TypeScript, มีระบบหลังบ้าน `app/(admin)/mgmt-portal` ที่ยังใช้งานอยู่
- งบประมาณและกำลังคนจำกัด: การเขียนใหม่ต้องทำทีละส่วนโดยเว็บไม่ล่ม

## ตัวเลือก

คะแนน 1–5 (5 = ดีที่สุด) น้ำหนักรวม 100%

| เกณฑ์ (น้ำหนัก) | Next.js 16 App Router (คงไว้) | Astro 5 + React islands | React Router 7 (framework mode, เดิม Remix) | SvelteKit 2 |
| --- | --- | --- | --- | --- |
| SEO (25%) | 5: RSC/SSG, Metadata API, file-based OG/sitemap | 5: static-first | 4: SSR ดี แต่ metadata/OG ต้องประกอบเอง | 5 |
| Interactivity (20%) | 5: client islands + Server Actions | 3: quiz ทั้งก้อนต้องเป็น island ใหญ่อยู่ดี | 5 | 5 |
| Team skill (20%) | 5 | 3 | 4 | 2 |
| Hosting cost (15%) | 4: Vercel first-class; หน้า static เยอะ ต้นทุนต่ำ | 5: static เกือบทั้งหมด | 4 | 4 |
| Migration cost (20%) | 5: ย้ายทีละ route ได้ | 2: เขียน admin ใหม่ด้วย | 2 | 1: เขียนใหม่ทั้งหมด |
| **รวมถ่วงน้ำหนัก** | **4.85** | 3.60 | 3.80 | 3.45 |

## การตัดสินใจ

คง **Next.js 16 App Router** และเขียนใหม่ทีละ route บน Design System "Scan & Flag"

### Rendering strategy: RSC-first, client islands

| Route | วิธี render | ไฟล์ |
| --- | --- | --- |
| `/` | static RSC, hero ไม่ซ่อนด้วย opacity 0 | `app/(main)/page.tsx` |
| `/learn`, `/learn/[slug]` | SSG, `dynamicParams = false` | `app/(main)/learn/**` |
| `/s/[score]` | SSG 11 หน้า (0–10), อื่น ๆ 404 | `app/(main)/s/[score]/page.tsx` |
| `/privacy` | RSC + island ปุ่มถอนความยินยอม/ลบข้อมูล | `app/(main)/privacy/page.tsx`, `privacy-actions.tsx` |
| `/result` | ISR `revalidate = 3600` (เนื้อหาจาก `getQuiz()`) + island อ่านคะแนนจาก store | `app/(main)/result/page.tsx` |
| `/survey` | RSC shell + form island | `app/(main)/survey/**` |
| `/quiz` | เป้าหมาย: RSC อ่าน `getQuiz()` (cache) + quiz island; ปัจจุบันยัง dynamic ผ่าน `fetchQuizQuestions()` | `app/(main)/quiz/**` |
| `/robots.txt` | dynamic (อ่าน `Host` header) | `app/robots.ts` |
| `/mgmt-portal/**`, `/api/**` | `force-dynamic` | `app/(admin)/**`, `app/api/**` |

- ข้อมูลส่วนบุคคลไม่ถูก render บน server: `/result` ดึงเฉพาะเนื้อหาที่ publish แล้ว ส่วนคะแนนอยู่ใน store ฝั่ง client
- **Server Actions** สำหรับทุกการเขียนที่ต้องตรวจสิทธิ์: `lib/actions/survey.ts`, `lib/actions/privacy.ts` (validate ด้วย zod, ตอบเป็น typed result, ไม่ throw ไปถึง client)
- **Route Handlers** เฉพาะสิ่งที่ต้องเป็น HTTP endpoint: `/api/health`, `/api/cron/keepalive`, `/api/analytics/*` (admin)
- **Caching tags**: เนื้อหา quiz ใช้ `unstable_cache` / `fetch(..., { next: { tags } })` ภายใต้ tag `content`, `content:quiz:<slug>`, `content:quizzes`, อายุ 3600 วินาที (`lib/content/source.ts`); ล้างด้วย `revalidateQuizContent()` / `revalidateAllContent()` ซึ่งใช้ `revalidateTag(tag, { expire: 0 })` ของ Next 16
- `proxy.ts` (ชื่อใหม่ของ middleware ใน Next 16) แตะ Supabase Auth เฉพาะคำขอที่มี cookie `sb-*-auth-token` และ fail-soft สำหรับหน้า public (`utils/supabase/middleware.ts`)

### State

- **zustand ใช้กับ quiz ที่กำลังเล่นเท่านั้น** (`store/quiz-store.ts`): คำตอบ, เวลา, session id ของรอบนี้ ไม่ persist ลง storage
- โทเค็นนิรนามอยู่ใน `sessionStorage` key `anon_jwt_cache` (`lib/services/anon-jwt.service.ts`) หายเมื่อปิดแท็บ
- ข้อมูลอื่นเป็น server state (RSC props) หรือ URL (`/s/[score]`); ไม่เพิ่ม global store ใหม่
- `store/quiz-store.backup.ts` เป็นไฟล์ค้างจากระบบเดิม ลบได้เมื่อหน้า quiz ย้ายเสร็จ

### Folder conventions

- `app/(main)` = เว็บสาธารณะ (layout ครอบ `ScanTransitionProvider`), `app/(admin)` = หลังบ้าน
- โฟลเดอร์ส่วนตัวของ route ใช้ `_components/` (ของเดิม `quiz/_component/` ให้เปลี่ยนชื่อตอนย้าย)
- `components/ds/*` = DS: `cva` + `cn`, ใช้ semantic token เท่านั้น (ไม่มี hex, ไม่มี `bg-blue-500`, ไม่มี gradient), `focus-ring`, touch target ≥ 44px
- `components/ui/*` = shadcn ของ admin (alias token ไว้ใน `app/globals.css`) ห้ามใช้ในหน้า public ใหม่
- `lib/<domain>/` แยกตามโดเมน: `content`, `privacy`, `security`, `seo`, `motion`, `quiz`
- โมดูลที่แตะ secret ต้อง `import "server-only"` (`utils/supabase/admin.ts`, `lib/security/require-admin.ts`, `lib/content/supabase-source.ts`, `lib/privacy/identity.ts`)
- module ที่เป็น pure data/logic (`lib/privacy/policy.ts`, `lib/content/types.ts`, `lib/security/csp.ts`) ห้าม import React/Supabase เพื่อให้ใช้ได้ทั้ง client, RSC, `next.config.ts` และ Jest
- Migration ตั้งชื่อ `NN-name.sql` ต้อง idempotent; test อยู่ `__tests__/<domain>/`

## ผลที่ตามมา

- ข้อดี: ย้ายทีละ route ได้ admin เดิมทำงานต่อ; Vercel รองรับ ISR, cron, OG image ในตัว
- ข้อดี: หน้าเนื้อหาเป็น static แทบทั้งหมด ต้นทุน function ต่ำ และ LCP ดี
- ข้อเสีย: ผูกกับ Vercel/Next มากขึ้น (`vercel.json` cron, Vercel system env ใน `lib/seo/site.ts`); ย้าย host ต้องทำ cron และ OG ใหม่
- ข้อเสีย: ช่วงเปลี่ยนผ่านมีโค้ดสองรุ่น (`framer-motion` + `motion/react`, `fetchQuizQuestions` + `getQuiz`) ต้องปิดงานใน Phase 1
- ข้อควรระวัง: Vercel Hobby plan มีเงื่อนไขใช้งานแบบส่วนบุคคล/ไม่ใช่เชิงพาณิชย์ และ cron ได้วันละครั้ง ให้เจ้าของโครงการตรวจว่าต้องใช้ Pro หรือไม่
- ติดตาม: เมื่อเปิด `cacheComponents` ของ Next 16 ให้ย้าย `unstable_cache` ไป `"use cache"` + `cacheTag()`
