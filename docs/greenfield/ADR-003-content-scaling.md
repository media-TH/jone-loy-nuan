# ADR-003: Content model และการขยายเนื้อหา

- สถานะ: Accepted
- วันที่: 2026-09-28
- เกี่ยวข้อง: ADR-001 (caching), ADR-004 (/learn), migration `09-content-model.sql`

## บริบท

- ระบบเดิมมี quiz เดียว 10 ข้อ และ hardcode ความหมายไว้ในแอป: `order_index = 1` คือหน้าจอกรอก PIN, ข้ออื่นใช้รูป `/images/scenarios/question-{n}/normal|result.svg`, ธงแดงของข้อ PIN อยู่ใน `components/red-flag-overlay.tsx`
- ต้องการ: หลาย quiz/แคมเปญ, scenario แบบใหม่ (แชต LINE, สายโทรเข้า, SMS) ที่เป็นข้อความจริงแทนรูป, ธงแดงที่ปักตำแหน่งได้, ทางเลือกให้ทีมสื่อแก้เนื้อหาใน CMS
- ข้อจำกัด: ห้ามพังข้อมูลเดิมใน Supabase และระบบหลังบ้านเดิมต้องแก้คำถามได้ต่อ

## การตัดสินใจ

### Content model (`lib/content/types.ts`)

- `Quiz` { id, slug, title, description, locale, status, version, questions }
- `Question` { id, order, prompt, category, kpiCategory, scenario, answers[], result, redFlags[] }
- `RedFlag` { number, label, detail?, x?, y? }: `x`/`y` เป็นเปอร์เซ็นต์ 0–100 ของกรอบ scenario และต้องมาคู่กัน
- `Scenario` เป็น discriminated union บน `kind`:

| kind | fields | renderer |
| --- | --- | --- |
| `image-pair` | `normalSrc`, `resultSrc`, `alt` | มี (ของเดิม) |
| `pin-entry` | `pinLength`, `prompt` | มี (ของเดิม) |
| `chat` | `app` (`line` / `messenger` / `sms`), `messages[]` + `evidence?` | ยังไม่มี |
| `call` | `caller`, `number`, `duration?` | ยังไม่มี |
| `sms` | `sender`, `body`, `evidence?` | ยังไม่มี |

- `EvidenceRange` { start, end, flag } เป็น shape เดียวกับ `components/ds/evidence-text.tsx` ใช้ไฮไลต์ข้อความที่เป็นหลักฐาน
- `RENDERABLE_SCENARIO_KINDS` + `isRenderableScenario()` แยก kind ที่แสดงผลได้วันนี้ออกจาก kind ที่ type ไว้ล่วงหน้า
- zod schema ใน `lib/content/schema.ts` ตรงกับ type ทีละตัว (`satisfies z.ZodType<...>` ถ้าไม่ตรง compile ไม่ผ่าน) และตรวจกติกาเนื้อหา: ≥ 2 คำตอบ (ยกเว้น `pin-entry`), มีคำตอบถูก ≥ 1, เลขธงไม่ซ้ำ, `evidence.flag` ต้องมีธงจริง, รูปต้องเป็น path `/…` หรือ `https:`
- `validateQuiz()` ทิ้งเฉพาะข้อที่ไม่ผ่านแล้ว log ไว้ ไม่ทำให้ทั้ง quiz ล่ม

### Scenario renderer registry (เป้าหมายของหน้า quiz ใหม่)

ยังไม่มีในโค้ด ให้หน้า quiz ใหม่ใช้รูปแบบนี้เพื่อให้ TypeScript บังคับว่า kind ที่ render ได้ทุกตัวมี renderer:

```tsx
const SCENARIO_RENDERERS = {
	"image-pair": ImagePairScenarioView,
	"pin-entry": PinEntryScenarioView,
} satisfies Record<RenderableScenario["kind"], ComponentType<any>>;
```

ข้อที่ `isRenderableScenario()` เป็น false ให้ข้ามพร้อม log ไม่ render ว่าง

### ContentSource adapters (`lib/content/source.ts`)

```ts
interface ContentSource {
	readonly name: string;
	getQuiz(slug: string, opts?: { locale?: Locale }): Promise<Quiz | null>;
	listQuizzes(): Promise<QuizSummary[]>;
}
```

| Source | ไฟล์ | อ่านจาก | เมื่อไร |
| --- | --- | --- | --- |
| Supabase (default) | `lib/content/supabase-source.ts` | `quizzes` + `rpc get_questions_with_answers` ด้วย anon key แบบไม่มี cookie, map ผ่าน `lib/content/legacy.ts` | production |
| Contentful (optional) | `lib/content/contentful-source.ts` | Delivery API ด้วย `fetch` (ไม่มี SDK), content types `quiz` / `question` / `answer` / `redFlag` บันทึกไว้หัวไฟล์ | `CONTENT_SOURCE=contentful` + `CONTENTFUL_SPACE_ID` + `CONTENTFUL_DELIVERY_TOKEN` |
| Fixture | `lib/content/fixture-source.ts` | SAMPLE 10 ข้อในโค้ด | preview ในเครื่องที่ไม่มี Supabase |

- เลือก source ใน `lib/content/index.ts` (`resolveContentSourceKind()`): `supabase` / `contentful` / `fixture` ตรงตัว; ว่าง, `auto` หรือ `local` = Supabase ถ้ามี `NEXT_PUBLIC_SUPABASE_URL` ไม่เช่นนั้น fixture (นอก production)
- ทุก source จบที่ `finalizeQuiz()`: validate แล้วคืน `null` ถ้าไม่เหลือข้อที่ใช้ได้
- error แยกชนิด: `ContentSourceError` (ติดต่อไม่ได้), `ContentConfigError` (env ผิด), `ContentValidationError` (quiz ทั้งก้อนผิด) และ **ไม่ cache ความล้มเหลวเป็น "ไม่พบ"**
- `legacy.ts` คงพฤติกรรมเดิม: ถ้าแถวมี `scenario` / `red_flags` (หลัง migration 09) จะชนะ rule ตาม `order_index`
- Supabase source ไม่เรียก `fetchQuizQuestions()` เพราะอ่าน cookies: Next ไม่อนุญาต `cookies()` ใน `unstable_cache` และ cache ที่แชร์ต้องไม่มี session ของ admin
- จำกัด 10 ข้อต่อ quiz (`QUIZ_QUESTION_LIMIT`)

### Caching และ revalidation

- อายุ cache 3600 วินาที (`CONTENT_REVALIDATE_SECONDS`) ใต้ tag `content`, `content:quiz:<slug>`, `content:quizzes`
- Supabase: `unstable_cache`; Contentful: `fetch(..., { next: { tags, revalidate } })`
- ล้างทันที: `revalidateQuizContent(slug)` / `revalidateAllContent()` (`revalidateTag(tag, { expire: 0 })`)
- **ช่องว่างปัจจุบัน**: Server Actions ของ admin (`lib/actions/questions.ts`: `upsertQuestion`, `deleteQuestionAction`, `updateQuizOrderAction`) ยังไม่เรียก `revalidateQuizContent()` การแก้จึงเห็นช้าสุด 1 ชั่วโมง; Contentful ต้องมี webhook route (ยังไม่ทำ) ที่ตรวจ secret แล้วเรียก `revalidateQuizContent`

### Database (migration 09)

- ตาราง `quizzes` (slug unique, `status` draft/published, `version`), RLS อ่านได้เฉพาะ `published`; default quiz `scam-awareness` id คงที่ `e7f40430-ba10-47ca-8265-03a04312d198` (`DEFAULT_QUIZ_ID`)
- `questions.quiz_id` (backfill + trigger ใส่ default quiz ให้แถวที่ admin เดิมสร้าง), `questions.scenario jsonb` + check `kind`, `order_index` unique ต่อ quiz
- `red_flags`: เพิ่ม `number`, `label`, `detail`, `x`, `y` + trigger sync กับ `flag_text` เดิม
- `get_questions_with_answers()` คืน `quiz_id`, `scenario`, `red_flags` เพิ่ม และคง security mode เดิม
- ความเสี่ยง: RPC นี้คืนคำถามของทุก quiz รวม draft และถูกเรียกได้ด้วย anon key; ถ้าต้องเก็บแคมเปญเป็นความลับก่อนเปิด ให้เพิ่มการกรอง `quizzes.status = 'published'` ใน function (และ parameter `p_quiz_id` เมื่อมีหลาย quiz)

### i18n

- `Locale = "th" | "en"`, `quizzes.locale`, Contentful map locale ผ่าน `CONTENTFUL_LOCALE_TH` / `CONTENTFUL_LOCALE_EN`; Supabase source มีภาษาไทยอย่างเดียว
- UI copy ยัง hardcode ภาษาไทยใน component; เมื่อจะเปิด `en`: แยก dictionary, เพิ่ม route segment ภาษา, ใส่ `alternates.languages` (hreflang) และ `inLanguage` ใน JSON-LD

## วิธีเพิ่ม quiz / แคมเปญใหม่ (Supabase)

1. insert แถว `quizzes` (`slug` ตัวพิมพ์เล็กคั่น `-`, `status = 'draft'`)
2. insert `questions` พร้อม `quiz_id`, `order_index` เริ่มที่ 1, `scenario` (jsonb ตาม `lib/content/schema.ts`), `answers`, `red_flags` (`number`, `label`, `detail`, `x`/`y`)
3. ตรวจด้วย `getQuiz(slug)` ใน preview (ข้อที่ถูกทิ้งจะมี log `[content:supabase] dropped question`)
4. `status = 'published'`, `published_at = now()`, เพิ่ม `version`
5. เรียก `revalidateQuizContent(slug)` (หรือรอ ≤ 1 ชม.)
6. ต้องทำครั้งแรกครั้งเดียว: route `/quiz/[slug]` (ปัจจุบัน `/quiz` เสิร์ฟ `DEFAULT_QUIZ_SLUG`), เพิ่มใน `app/sitemap.ts` และ `quizJsonLd()`

## วิธีเพิ่ม scenario kind ใหม่

1. เพิ่ม type ใน union `Scenario` และ `SCENARIO_KINDS` (`lib/content/types.ts`)
2. เพิ่ม schema ใน `scenarioSchema` (`lib/content/schema.ts`); ถ้ามี evidence ให้เพิ่มใน `scenarioEvidence()`
3. migration ใหม่ ขยาย `chk_questions_scenario_kind` (drop แล้ว add ใหม่)
4. สร้าง renderer ด้วย DS (`ScenarioFrame`, `EvidenceText`, `RedFlagPin`) แล้วลงทะเบียนใน registry และ `RENDERABLE_SCENARIO_KINDS`
5. Contentful: field `scenario` เป็น JSON อยู่แล้ว ไม่ต้องแก้ mapping
6. เพิ่มตัวอย่างใน fixture และ test ใน `__tests__/content/`

## ผลที่ตามมา

- ข้อดี: UI เห็นแค่ type เดียวไม่ว่าเนื้อหามาจากไหน; เปลี่ยน CMS ได้โดยไม่แตะหน้า quiz
- ข้อดี: migration 09 เป็น additive ผู้เล่นไม่เห็นความเปลี่ยนแปลงจนกว่าจะตั้ง `scenario`
- ข้อเสีย: มีสองโลกระหว่างเปลี่ยนผ่าน (`legacy.ts` + `scenario`) จนกว่าคำถามเดิมจะถูกแปลงเป็น `scenario` ครบ
- ข้อเสีย: Contentful เป็นอีกระบบที่ต้องดูแลสิทธิ์และ content model; เปิดใช้เมื่อทีมสื่อต้องการแก้เองเท่านั้น
