# ADR-004: SEO, หน้าเนื้อหา และฟีเจอร์เพื่อผู้ใช้

- สถานะ: Accepted
- วันที่: 2026-09-28
- เกี่ยวข้อง: ADR-001 (rendering), ADR-002 (LCP), ADR-006 (ไม่มี PII ในหน้าแชร์)

## บริบท

- ระบบเดิม: canonical ทุกหน้าชี้ `/`, favicon ชี้ไฟล์ที่ไม่มี, ไม่มี `/og-image.jpg` จริง, ไม่มี sitemap/robots, ไม่มีหน้าเนื้อหาให้ค้นเจอนอกจากหน้าแรก
- คนไทยแชร์ลิงก์ผ่าน LINE / Facebook เป็นหลัก ภาพ preview จึงเป็นหน้าร้านจริงของแคมเปญ
- ต้องกัน preview deployment และ fork ไม่ให้แย่งอันดับกับเว็บจริง

## การตัดสินใจ

### Site identity และ metadata

- `lib/seo/site.ts` เป็นที่เดียวที่รู้ origin: `NEXT_PUBLIC_SITE_URL` (default `https://xn--12co4czb5a2kj.online`), `SITE_NAME`, `PUBLISHERS`, `absoluteUrl()`
- root metadata (`app/layout.tsx`): `metadataBase`, title template `%s | สแกนโจร.online`, `alternates.canonical: "./"` และ `openGraph.url: "./"` (`baseOpenGraph` ใน `lib/seo/metadata.ts`) ทำให้ทุกหน้าเป็น canonical ของตัวเอง, `twitter.card = summary_large_image`, Google verification เฉพาะเมื่อตั้ง `GOOGLE_SITE_VERIFICATION`
- กฎ: route ที่ตั้ง `openGraph` ต้อง spread `baseOpenGraph` และห้ามตั้ง `images` (ภาพมาจาก file convention)
- การ index ตัดสินตอน build: `isIndexableDeployment()` = `VERCEL_ENV === "production"` และ host production ตรงกับ canonical (จับ fork ที่ลืมตั้ง `NEXT_PUBLIC_SITE_URL` ผ่าน `VERCEL_PROJECT_PRODUCTION_URL`)

| หน้า | robots | ที่มา |
| --- | --- | --- |
| `/`, `/quiz`, `/learn/**`, `/privacy` | index,follow (เฉพาะ production จริง) | `siteRobots` |
| `/survey`, `/result` | noindex,nofollow | `privatePageRobots` ใน layout ของ route |
| `/s/[score]` | noindex, follow | `shareLandingRobots` (crawl ได้เพื่อ preview) |
| `/mgmt-portal/**`, `/login`, `/api/**` | header `X-Robots-Tag: noindex, nofollow` | `next.config.ts` |

### Sitemap, robots, manifest

- `app/sitemap.ts`: `/`, `/quiz`, `/learn`, `/learn/[slug]` × 6 (`lastModified` จาก `updatedAt`), `/privacy`
- `app/robots.ts` อ่าน `Host` ทุกคำขอ: host จริงบน production ได้ `allow /` + disallow `/mgmt-portal`, `/api`, `/login`, `/survey`, `/result` + sitemap; host อื่นทั้งหมดได้ `Disallow: /`
- `app/manifest.ts` เสิร์ฟ `/manifest.webmanifest` แทน `public/site.webmanifest`

### Open Graph images (ภาษาไทย)

- `app/opengraph-image.tsx` (ทั้งเว็บ, ใช้เป็น `twitter:image` ด้วย), `app/(main)/learn/[slug]/opengraph-image.tsx`, `app/(main)/s/[score]/opengraph-image.tsx`
- ชุดวาดใน `lib/seo/og.tsx`: 1200×630, สี DS แบบ hex (Satori อ่าน CSS variable ไม่ได้), ฟอนต์ Chakra Petch จาก `assets/fonts/` (OFL) เพราะฟอนต์ในตัวของ `next/og` ไม่มีภาษาไทย
- ข้อจำกัด: `next/og` วางวรรณยุกต์ซ้อนของไทยผิด (เช่น เสี่ยง, ที่, ต่ำ, ปัก) ข้อความในภาพทั้งหมดจึงอยู่ใน `lib/seo/og-text.ts` และ `__tests__/seo/content.test.ts` ปฏิเสธ cluster ที่มีปัญหาผ่าน `findOgThaiIssues()`
- ไม่เพิ่ม `app/twitter-image.tsx` เพราะไฟล์ระดับ root จะทับภาพของแต่ละหน้า

### JSON-LD (`lib/seo/structured-data.ts`, render ด้วย `<JsonLd>` ที่ escape `< > &`)

| หน้า | types |
| --- | --- |
| ทุกหน้า (root layout) | `WebSite` + `Organization` × 2 (ธปท., กองทุนพัฒนาสื่อฯ) มี `@id` คงที่ |
| `/quiz` | `Quiz` (+ `Audience`, `Thing`) |
| `/learn` | `CollectionPage` + `ItemList`, `BreadcrumbList` |
| `/learn/[slug]` | `Article`, `FAQPage` (`Question` / `Answer`), `BreadcrumbList` |

### Learn hub และหน้าแชร์

- `/learn`: 6 บทความ static ใน `lib/content/learn-articles.ts` (แก๊งคอลเซ็นเตอร์, SMS ลิงก์ปลอม, LINE/โซเชียลปลอม, ลงทุน, หลอกรัก, ร้านค้า/งานปลอม) ไม่มีสถิติ; ช่องทางแจ้งเหตุมีเพียง 1441, 1213 และ thaipoliceonline.go.th (test บังคับ)
- `/s/[score]`: เฉพาะ `/s/0`–`/s/10` (`dynamicParams = false`), URL และภาพมีแค่คะแนน ไม่มีชื่อ, id หรือคำตอบ; ลิงก์สร้างด้วย `shareScoreUrl()` (`lib/seo/share.ts`) จาก `/result`
- ปุ่มแชร์ `components/share/share-actions.tsx`: Web Share API → LINE, Facebook, คัดลอกลิงก์ (มี fallback สำหรับ in-app browser) ประกาศผลเป็นคำ + ไอคอน + สี

### PWA

- มีเฉพาะ manifest (standalone, portrait, สี `surface`) ยังไม่มี service worker โดยตั้งใจ
- ถ้าเพิ่มภายหลัง: cache ได้เฉพาะหน้า static (`/learn/**`) และ asset; ห้าม cache Server Actions, `/api/**`, หน้า result หรือสิ่งที่มีโทเค็น

### Accessibility (เป้าหมาย WCAG 2.2 AA)

- `<html lang="th">`; ฟอนต์ body แบบมีหัว (IBM Plex Sans Thai Looped) อ่านง่ายสำหรับผู้สูงอายุ, leading สูงสำหรับวรรณยุกต์
- contrast จาก token: `ink` ≥ 14:1, `ink-muted` ≥ 5.8:1, ขอบ control `line-strong` ≥ 3.4:1, `focus` ≥ 3:1 ทุกพื้น
- DS: `focus-ring`, touch target ≥ 44px, สถานะเป็นคำ + ไอคอน + สีเสมอ (`StatusBadge`, `StatusIcon`), สีถูกเป็นฟ้า (`safe`) ไม่ใช่เขียว เพื่อคนตาบอดสี
- live region สำหรับคะแนน (`ScoreNumeral`), ผลการแชร์ และผลบนหน้า privacy; reduced motion ทั้งแอป (ADR-002)
- `formatDetection.telephone = false` เพื่อไม่ให้เบอร์ในหลักฐานกลายเป็นลิงก์โทรออก
- ยังขาด: skip link ไป `#main` (อยู่ใน backlog)

### Core Web Vitals budgets (p75 มือถือ)

| Metric | Budget | ตัวช่วยในโค้ด |
| --- | --- | --- |
| LCP | ≤ 2.5s (เป้า ≤ 2.0s หน้า `/` และ `/learn/*`) | static/ISR RSC, hero ไม่เริ่มที่ opacity 0, scenario ข้อแรกได้ `priority` และข้อถัดไปถูก preload (`components/quiz/*`), `next/font` self-host + `display: swap` |
| INP | ≤ 200ms | Server Actions แทน client fetch, motion ไม่บล็อก input |
| CLS | ≤ 0.1 (เป้า ≤ 0.05) | animation ใช้ transform เท่านั้น, `ScoreNumeral` จองความกว้างตัวเลข |
| First-load JS | เป้า ≤ 180 KB gzip หน้าเนื้อหา, ≤ 250 KB `/quiz` | `LazyMotion`, RSC-first |

- วัดผล: `@vercel/speed-insights` อยู่ใน dependencies และ CSP อนุญาตแล้ว แต่ยังไม่ mount; ก่อนเปิดให้เพิ่มใน `PROCESSORS` / `DATA_INVENTORY` ของ `lib/privacy/policy.ts`

## Backlog ฟีเจอร์เพื่อผู้ใช้ (เรียงตามลำดับความสำคัญ)

| ลำดับ | ฟีเจอร์ | ประโยชน์ | Effort | หมายเหตุ |
| --- | --- | --- | --- | --- |
| P1 | ปุ่มขยายตัวอักษร (A / A+ / A++) | ผู้สูงอายุอ่านหลักฐานได้ชัด | S | เก็บค่าใน `localStorage` (ไม่ใช่ข้อมูลส่วนบุคคล แต่เพิ่มใน `CLIENT_STORAGE`) |
| P1 | Skip link + ตรวจ a11y อัตโนมัติ (axe ใน Jest) | ผู้ใช้ keyboard / screen reader | S | |
| P1 | ข้อความแชร์ "ชวนพ่อแม่ลองทำ" ผ่าน LINE | ขยายไปกลุ่มเสี่ยงสูง | S | ใช้ `/s/[score]` เดิม |
| P2 | อ่านออกเสียง scenario (Web Speech `th-TH`) | ผู้ที่อ่านลำบาก | M | ต้องมีปุ่มหยุด และทดสอบบน Android WebView |
| P2 | การ์ดสรุปธงแดงบันทึกเป็นภาพ | เก็บไว้ดู/ส่งต่อในครอบครัว | M | ใช้ชุดวาด `lib/seo/og.tsx` ซ้ำ |
| P2 | Scenario แบบ chat / call / sms | สมจริงกว่า, ข้อความเลือก/ขยายได้ | M | ADR-003 |
| P2 | Dark mode toggle | ใช้งานกลางคืน | S | token `.dark` มีแล้วใน `app/globals.css` แต่ยังไม่มีตัวสลับ |
| P3 | แคมเปญหมุนเวียน (สถานการณ์ใหม่ตามข่าว) | เนื้อหาทันกลโกงใหม่ | M | `/quiz/[slug]` (ADR-003) |
| P3 | Offline `/learn` (service worker) | สัญญาณอ่อน | M | ตามกฎ PWA ข้างบน |
| P3 | ภาษาอังกฤษ | ชาวต่างชาติในไทย | L | ADR-003 i18n |

## ผลที่ตามมา

- ข้อดี: preview/fork ไม่ถูก index สองชั้น (meta ตอน build + robots ตาม host)
- ข้อดี: หน้าแชร์ไม่เปิดเผยข้อมูลใด ๆ นอกจากคะแนน
- ข้อเสีย: ข้อความในภาพ OG ต้องเลี่ยงคำไทยบางคำจนกว่า `next/og` จะรองรับการวางวรรณยุกต์
- ข้อเสีย: `robots.txt` เป็น dynamic (อ่าน header) มีต้นทุน function เล็กน้อยต่อคำขอ
