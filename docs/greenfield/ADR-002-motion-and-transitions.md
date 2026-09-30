# ADR-002: Motion และ route transitions

- สถานะ: Accepted
- วันที่: 2026-09-28
- เกี่ยวข้อง: ADR-001, ADR-004 (Core Web Vitals, accessibility)

## บริบท

- แนวคิด "Scan & Flag": เลนส์สแกนหลักฐาน (scan) แล้วปักธงแดงบนจุดน่าสงสัย (flag) motion ทุกชิ้นต้องมาจากสองคำกริยานี้
- ผู้ใช้หลายคนเป็นผู้สูงอายุ และบางคนตั้ง "ลดการเคลื่อนไหว" ไว้ในเครื่อง; หลายคนเปิดผ่าน in-app browser บนมือถือราคาประหยัด
- ระบบเดิมใช้ `framer-motion` แบบ `motion.*` เต็ม bundle และมี transition หลายแบบ (`components/page-transition.tsx`, `components/stair-transition.tsx`, `lib/motion/quiz-motion.ts`)
- App Router unmount หน้าเก่าทันทีที่ route commit จึงพึ่ง exit animation ของหน้าไม่ได้

## ตัวเลือก

| ตัวเลือก | ข้อดี | ข้อเสีย | ผล |
| --- | --- | --- | --- |
| `motion/react` v12 (`m.*` + `LazyMotion`) | declarative ใน React, spring, `AnimatePresence`, `layoutId`, `useReducedMotion`, ทีมคุ้นเคย | ต้องระวัง bundle (แก้ด้วย `LazyMotion`) | **เลือก** |
| import จาก `framer-motion` | API เดียวกัน | เป็นชื่อแพ็กเกจเดิม; entry point ที่ดูแลต่อคือ `motion/react`; มีสองชื่อใน repo = สับสน | ห้าม import ใหม่ |
| GSAP | timeline ละเอียด | imperative ต้องจัดการ cleanup เอง, ไม่มี `layoutId`/exit แบบ React, เป็นระบบ animation ที่สองใน bundle | ไม่เลือก |
| CSS ล้วน (Tailwind transitions) | 0 KB JS, ทำงานบน compositor | ไม่มี spring จริง, ไม่มี exit/`layoutId`, นับเลขไม่ได้ | ใช้เฉพาะ micro (moment 8) |
| View Transitions API | native, ไม่ต้อง overlay | ใน Next.js/React ยังเป็น experimental, การรองรับใน in-app browser / WebView รุ่นเก่าไม่แน่นอน | ทบทวนภายหลัง |

## การตัดสินใจ

### Setup ทั้งแอป

- `components/motion/motion-provider.tsx` ครอบทั้งแอปใน `app/layout.tsx`: `<LazyMotion features={domMax}>` + `<MotionConfig reducedMotion="user">`
- โค้ดใหม่ใช้ `m.*` เท่านั้น และ import จาก `"motion/react"` (`domMax` จำเป็นเพราะ Progress Rail ใช้ `layoutId`)
- `reducedMotion="user"`: เมื่อเครื่องขอลดการเคลื่อนไหว transform/layout จะถูกข้าม แต่ opacity/สียังเปลี่ยน ซึ่งเป็น fallback ที่ออกแบบไว้ของทุก preset; moment ที่เป็นของตกแต่งล้วนข้ามทั้งหมด: Scan Reveal ซ่อน band ด้วย CSS (`motion-reduce:hidden`) ไม่ใช่ render ต่างกัน เพราะ `useReducedMotion()` เป็น `null` บน server แต่เป็น `true` ตั้งแต่ render แรกฝั่ง client ทำให้ hydration ไม่ตรง; นับคะแนนและเข็มมาตรวัดเช็ก `useReducedMotion()` ใน effect/ค่าของ animation เท่านั้น
- config animation พิมพ์แบบหลวม (`any`) ตาม `AGENTS.md`; type เข้มเก็บไว้ที่ขอบเขต data/API

### Tokens: CSS และ TS ต้องตรงกัน

| Token | CSS (`app/globals.css`) | TS (`lib/motion/tokens.ts`) |
| --- | --- | --- |
| dur instant / quick / base / slow / page / scan | `--dur-*` 90 / 160 / 240 / 400 / 560 / 900ms | `DUR.*` 0.09 … 0.9 (วินาที) |
| ease settle / wipe / exit | `--ease-settle`, `--ease-wipe`, `--ease-exit` | `EASE.settle`, `EASE.wipe`, `EASE.exit` |
| springs press / pin / sheet / layout | ไม่มี (code only) | `SPRING.*` |
| stagger lists / pins | ไม่มี | `STAGGER.list` 0.06, `STAGGER.pins` 0.08 |

ยังไม่มี test ที่บังคับให้สองไฟล์ตรงกัน: ขั้นต่อไปคือเพิ่ม test ที่อ่าน `--dur-*` / `--ease-*` จาก `globals.css` แล้วเทียบกับ `DUR` / `EASE`

### The 8 moments (นอกจากนี้ไม่มีอะไรขยับ)

| # | Moment | Implementation | Reduced motion |
| --- | --- | --- | --- |
| 1 | Scan Wipe (route transition) | `components/motion/scan-transition.tsx`, `wipePanel` | ไม่มี panel, navigate ทันที; `template.tsx` ให้ crossfade 120ms (`routeCrossfade`) แทน |
| 2 | Scan Reveal (scenario เข้า) | `components/motion/scan-reveal.tsx`, `scanSweep`; ใช้ใน `ScenarioFrame` และ cover หน้าแรก | ซ่อน band ด้วย `motion-reduce:hidden` (markup เหมือนเดิม) |
| 3 | Flag Plant | `components/ds/red-flag-pin.tsx`: `flagPlant` (spring pin, stagger 80ms) + `pinPulse` | fade อย่างเดียว |
| 4 | Answer feedback | `components/ds/answer-option.tsx` (`pressable`, `wrongNudge`), `status-icon.tsx` (`iconDraw`) | เปลี่ยนสีอย่างเดียว |
| 5 | Result sheet | `components/ds/result-sheet.tsx`: `sheetUp`, `scrimFade`, `staggerChildren` | fade |
| 6 | Progress rail | `components/ds/progress-rail.tsx`: `layoutId="progress-rail-indicator"`, `railIndicator` | กระโดดไปตำแหน่งใหม่ |
| 7 | Score + risk meter | `score-numeral.tsx` นับ 800ms (`DUR.slow * 2`), `risk-meter.tsx` เข็มหมุนเมื่อ `useInView` | แสดงค่าสุดท้ายทันที; ตัวเลขประกาศผ่าน live region หลังนับเสร็จ |
| 8 | Micro (CTA) | `components/ds/button.tsx` CSS: `hover:-translate-y-0.5`, `active:translate-y-0.5` + ledge | `motion-reduce:transform-none` |

### Scan Wipe: design

```mermaid
stateDiagram-v2
  [*] --> idle
  idle --> covering: TransitionLink / useTransitionRouter().push
  covering --> covered: onAnimationComplete แล้ว router.push(href)
  covered --> revealing: pathname เปลี่ยน หรือครบ MAX_COVERED_MS 5000
  revealing --> idle: panel ออกทางด้านบน
```

- panel `bg-navy-800` + เส้นสแกน `bg-screen-300` สูง 2px ที่ขอบนำ, `z-(--layer-transition)`, ข้อความ "กำลังสแกน…", `aria-hidden`
- ขาเข้า/ขาออก = `DUR.page` 560ms + `EASE.wipe`; ขณะ idle panel เป็น `invisible pointer-events-none`
- ข้าม wipe และ navigate ตรงเมื่อ: reduced motion, ไปหน้าเดิม, คนละ origin, คลิกพร้อม modifier / ปุ่มอื่น, `target` ไม่ใช่ `_self`
- back/forward และ `<Link>` ธรรมดาไม่ wipe: `app/(main)/template.tsx` ให้ crossfade 120ms (opacity อย่างเดียว) แทน; หน้าที่มาถึงใต้ panel (`useScanWipeActive()`) ไม่ fade ซ้ำ
- ไม่ทิ้งการนำทาง: ถ้ามีการนำทางใหม่ระหว่าง wipe (แตะซ้ำ, กด Back ระหว่างปิดจอ) จะส่งให้ router ตรง ๆ และ wipe ที่ค้างอยู่จะเปิดจอให้เห็นหน้าปัจจุบันแทนการ push ปลายทางเดิมที่ล้าสมัย
- fail-safe: หน้าจอไม่ถูกปิดค้างเกิน 5 วินาที แม้ route ไม่ commit

### กฎ LCP

- เนื้อหาหลักที่ server render ต้องไม่เริ่มที่ `opacity: 0`
- `template.tsx` ใช้ flag ระดับ module (`hasHydrated`): paint แรกจาก server ไม่ animate; เฉพาะการนำทางฝั่ง client ครั้งถัดไปเท่านั้นที่ crossfade และใช้ object target ไม่ใช่ variant label ลูก `m.*` จึงไม่รับ animation ต่อจาก template
- Scan Reveal เป็น overlay `absolute` เหนือเนื้อหาที่มองเห็นครบแล้ว จึงไม่กระทบ LCP และ CLS
- ห้ามซ่อน hero/cover หน้าแรกเพื่อรอ animation (`app/(main)/page.tsx`)

## Performance budget

- animate เฉพาะ `transform` และ `opacity` (compositor); ข้อยกเว้นเดียวคือ FLIP ของ `layoutId` ใน Progress Rail
- ≤ 1 animation เต็มจอพร้อมกัน; ทุก moment ≤ 560ms ยกเว้น Scan Reveal (900ms, ตกแต่ง, ไม่บล็อก input) และนับคะแนน (800ms)
- ไม่มี animation ใดทำให้ layout ขยับ: เป้าหมาย CLS จาก motion = 0; press feedback ไม่รอ animation จบก่อนตอบสนอง (INP)
- JS: `m` + `LazyMotion` แทน `motion.*`; ขั้นต่อไปคือโหลด `domMax` แบบ async (`features={() => import(...)}`) และเปิด `strict` ใน `LazyMotion` (throw เมื่อมีใคร render `motion.*` ซึ่งจะดึง feature bundle เต็มมาด้วย)
- ห้าม import `framer-motion` ในโค้ดใหม่: หน้า quiz ใหม่ (`app/(main)/quiz/_components/*`, `components/quiz/*`) ไม่ import motion เองเลย ได้ moment ทั้งหมดผ่าน DS components และใช้ `DUR` / `STAGGER` เพียงจังหวะเปิด result sheet; ไฟล์ legacy (`components/page-transition.tsx`, `stair-transition.tsx`, `stairs.tsx`, `page-content.tsx`, `lib/motion/quiz-motion.ts`, `lib/constants.ts`) ลบแล้ว และถอด `framer-motion` ออกจาก `package.json` แล้ว (ยังอยู่ใน lockfile ในฐานะ dependency ภายในของแพ็กเกจ `motion`)

## ผลที่ตามมา

- ข้อดี: motion มี inventory ชัด ตรวจ code review ง่าย ("นี่คือ moment ไหน?")
- ข้อดี: reduced motion ได้ผลทั้งแอปจากจุดเดียว
- ข้อเสีย: Scan Wipe เป็น overlay ของเราเอง ต้องดูแลกรณีขอบ (timeout, back/forward) เอง
- reduced motion ของ Scan Wipe เป็น crossfade 120ms ตาม spec (`routeCrossfade` ใน `template.tsx`)
- ติดตาม: โหลด `domMax` แบบ async และเปิด `LazyMotion strict`
