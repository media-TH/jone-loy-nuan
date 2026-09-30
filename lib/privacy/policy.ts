/**
 * PDPA (พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562) — the single source of truth for what สแกนโจร.online
 * collects, why, on which lawful basis, who processes it and for how long.
 *
 * Consumed by the privacy notice (app/(main)/privacy), the survey's ConsentPanel (PURPOSES), the
 * Server Actions (POLICY_VERSION, ERASABLE_CLIENT_KEYS) and mirrored in SQL by
 * supabase/migrations/08-pdpa-consent-retention.sql (RETENTION, RETENTION_JOB). A unit test keeps the
 * SQL intervals in sync with RETENTION.
 *
 * Pure data, no imports from React or Supabase: safe in client components, RSC and tests.
 */

// ---------------------------------------------------------------------------------------------
// Version
// ---------------------------------------------------------------------------------------------

/**
 * Version of the privacy notice. Every consent record stores it, so bump it (ISO date of the new
 * text) whenever purposes, data or recipients change materially; consent given under an older
 * version is then asked for again.
 */
export const POLICY_VERSION = "2026-09-28";

/** Human-readable effective date of POLICY_VERSION (Thai, Buddhist Era). */
export const POLICY_EFFECTIVE_DATE_LABEL = "28 กันยายน 2569";

/** Where the notice lives; also where consent is withdrawn and data erased. */
export const PRIVACY_PATH = "/privacy";
/** Anchors on the privacy page (linked from the survey and the result page). */
export const PRIVACY_SECTION_IDS = {
	withdraw: "withdraw-consent",
	erase: "delete-my-data",
} as const;

// ---------------------------------------------------------------------------------------------
// Lawful bases and purposes
// ---------------------------------------------------------------------------------------------

export type LawfulBasisId = "legitimate_interest" | "consent";

export type LawfulBasis = {
	label: string;
	section: string;
	summary: string;
};

export const LAWFUL_BASES: Readonly<Record<LawfulBasisId, LawfulBasis>> = {
	legitimate_interest: {
		label: "ประโยชน์โดยชอบด้วยกฎหมาย",
		section: "มาตรา 24(5)",
		summary:
			"ใช้เท่าที่จำเป็นเพื่อให้บริการแบบทดสอบ ดูแลความปลอดภัยของระบบ และทำสถิติภาพรวมแบบไม่ระบุตัวตน โดยไม่กระทบสิทธิของคุณเกินสมควร",
	},
	consent: {
		label: "ความยินยอม",
		section: "มาตรา 19",
		summary:
			"ใช้เฉพาะเมื่อคุณเลือกยินยอม แยกเป็นเรื่อง ๆ และคุณถอนความยินยอมได้ตามวิธีในหัวข้อ “ถอนความยินยอม”",
	},
};

/** Months each kind of data is kept. Mirrored in SQL by public.pdpa_retention_purge(). */
export const RETENTION = {
	/**
	 * Demographic survey (consent, s.19): 12 months from submission. Awareness campaigns are planned
	 * on a yearly cycle, so one year of row-level answers covers one planning round. After that the
	 * rows are rolled up into monthly counts per single dimension (no row-level data, no
	 * cross-tabulation) and deleted.
	 */
	demographics: { months: 12, action: "aggregate_then_delete" },
	/**
	 * Quiz sessions + answers (legitimate interest, s.24(5)): 24 months, i.e. two yearly cycles so
	 * year-over-year change in scam awareness can be measured. Then the random user id, user agent
	 * and fingerprint are removed and the session id is replaced: what remains (answers, scores,
	 * device type) can no longer be linked to anyone and is anonymous statistics.
	 */
	quizSessions: { months: 24, action: "anonymise" },
	/**
	 * Consent log (legitimate interest, s.24(5): proving when consent was given or withdrawn).
	 * 5 years: it must outlive the data it covers (≤ 12 months) plus the limitation period for
	 * claims under s.78 (3 years from when the damage becomes known), with a margin for late
	 * discovery. Rows hold only the random id, purpose, yes/no, notice version and time.
	 */
	consentLog: { months: 60, action: "delete" },
} as const;

export type RetentionKey = keyof typeof RETENTION;

/** The daily database job that applies RETENTION. */
export const RETENTION_JOB = {
	name: "pdpa-retention-purge",
	/** pg_cron runs in UTC: 19:30 UTC = 02:30 Asia/Bangkok (UTC+7, no daylight saving). */
	cronUtc: "30 19 * * *",
	localTimeLabel: "02:30 น. เวลาประเทศไทย",
} as const;

/** Lifetime of the anonymous token in the browser (issue-anon-jwt TOKEN_TTL_SECONDS default). */
export const ANON_TOKEN_TTL_HOURS = 24;

/** Shape ConsentPanel (components/ds/consent-panel.tsx) accepts, plus the legal basis behind it. */
export type PrivacyPurpose = {
	id: string;
	title: string;
	description: string;
	/** "necessary" = another lawful basis, shown as information; "consent" = its own opt-in switch. */
	basis: "necessary" | "consent";
	lawfulBasis: LawfulBasisId;
};

/** Every purpose, in the order the notice and ConsentPanel list them. Pass straight to ConsentPanel. */
export const PURPOSES = [
	{
		id: "quiz",
		title: "ให้คุณเล่นแบบทดสอบและดูผลลัพธ์",
		description:
			"บันทึกคำตอบ คะแนน และเวลาที่ใช้ในรอบนี้ไว้กับรหัสสุ่มที่ไม่ระบุตัวตน เพื่อแสดงผลลัพธ์และธงแดงของแต่ละข้อให้คุณ",
		basis: "necessary",
		lawfulBasis: "legitimate_interest",
	},
	{
		id: "statistics",
		title: "สถิติภาพรวมแบบไม่ระบุตัวตน",
		description:
			"นำคำตอบ คะแนน และประเภทอุปกรณ์ (มือถือ แท็บเล็ต หรือคอมพิวเตอร์) มารวมเป็นตัวเลขสถิติ เพื่อปรับปรุงเนื้อหาให้คนไทยรู้เท่าทันมิจฉาชีพ",
		basis: "necessary",
		lawfulBasis: "legitimate_interest",
	},
	{
		id: "demographics",
		title: "ข้อมูลประชากรเพื่อวางแผนการสื่อสาร",
		description: `ช่วงอายุ เพศ จังหวัด ระดับการศึกษา และอาชีพ ใช้ดูว่ากลุ่มใดควรได้รับความรู้เรื่องใดเพิ่ม เก็บไม่เกิน ${RETENTION.demographics.months} เดือน แล้วเหลือเพียงตัวเลขสถิติรวม ถ้าคุณอายุต่ำกว่า 20 ปี เราไม่เก็บข้อมูลส่วนนี้`,
		basis: "consent",
		lawfulBasis: "consent",
	},
] as const satisfies readonly PrivacyPurpose[];

export type PurposeId = (typeof PURPOSES)[number]["id"];

/** Purposes that need an explicit, separate opt-in (s.19). */
export const CONSENT_PURPOSE_IDS = ["demographics"] as const;
export type ConsentPurposeId = (typeof CONSENT_PURPOSE_IDS)[number];

/** ConsentPanel `namePrefix`: each switch submits `${CONSENT_FIELD_PREFIX}${id}=granted`. */
export const CONSENT_FIELD_PREFIX = "consent_";

export function consentFieldName(purpose: ConsentPurposeId): string {
	return `${CONSENT_FIELD_PREFIX}${purpose}`;
}

export function isConsentPurposeId(value: unknown): value is ConsentPurposeId {
	return typeof value === "string" && (CONSENT_PURPOSE_IDS as readonly string[]).includes(value);
}

// ---------------------------------------------------------------------------------------------
// Data inventory (s.23: what is collected, where, why, lawful basis, retention)
// ---------------------------------------------------------------------------------------------

export type DataCategory = {
	id: string;
	title: string;
	/** Exactly what is collected. */
	items: string;
	/** Where it is stored. */
	storedIn: string;
	purpose: string;
	lawfulBasis: LawfulBasisId;
	/** Plain-language retention; the machine-readable limit is in RETENTION. */
	retention: string;
	retentionKey?: RetentionKey;
	/** Optional to provide (nothing happens if you do not). */
	optional?: boolean;
};

export const DATA_INVENTORY = [
	{
		id: "quiz_answers",
		title: "คำตอบและผลแบบทดสอบ",
		items: "ตัวเลือกที่ตอบในแต่ละข้อ ถูกหรือผิด เวลาที่ใช้ตอบ คะแนนรวม และเวลาเริ่มและจบแบบทดสอบ",
		storedIn: "ฐานข้อมูล Supabase (ตาราง quiz_sessions และ question_responses)",
		purpose: "แสดงผลลัพธ์ให้คุณ และทำสถิติภาพรวมแบบไม่ระบุตัวตน",
		lawfulBasis: "legitimate_interest",
		retention: `${RETENTION.quizSessions.months} เดือน จากนั้นตัดรหัสสุ่มและข้อมูลเบราว์เซอร์ออก เหลือเป็นสถิติที่ไม่ระบุตัวตน`,
		retentionKey: "quizSessions",
	},
	{
		id: "anonymous_id",
		title: "รหัสผู้ใช้แบบสุ่ม",
		items:
			"รหัสที่ระบบสุ่มขึ้นให้แท็บเบราว์เซอร์ของคุณ ไม่ผูกกับชื่อ เบอร์โทรศัพท์ อีเมล หรือบัญชีใด ๆ",
		storedIn: "เบราว์เซอร์ของคุณ (sessionStorage) และฐานข้อมูล Supabase",
		purpose: "รวมคำตอบของรอบเดียวกันไว้ด้วยกัน และยืนยันว่าเป็นคุณเมื่อขอลบข้อมูล",
		lawfulBasis: "legitimate_interest",
		retention: `ในเบราว์เซอร์: จนกว่าจะปิดแท็บ หรือครบ ${ANON_TOKEN_TTL_HOURS} ชั่วโมง · ในผลแบบทดสอบ: ${RETENTION.quizSessions.months} เดือน แล้วลบออก · ในบันทึกความยินยอม (ถ้าคุณเคยเปิดหรือปิดความยินยอม): ${RETENTION.consentLog.months / 12} ปี แล้วลบ`,
		retentionKey: "quizSessions",
	},
	{
		id: "device",
		title: "ประเภทอุปกรณ์และเบราว์เซอร์",
		items:
			"ประเภทอุปกรณ์ (มือถือ แท็บเล็ต หรือคอมพิวเตอร์) และข้อความระบุรุ่นเบราว์เซอร์ (user agent)",
		storedIn: "ฐานข้อมูล Supabase (ตาราง quiz_sessions)",
		purpose: "ปรับหน้าจอให้ใช้งานได้ดีบนทุกอุปกรณ์ และทำสถิติภาพรวม",
		lawfulBasis: "legitimate_interest",
		retention: `ประเภทอุปกรณ์เก็บเป็นสถิติ · user agent ลบออกเมื่อครบ ${RETENTION.quizSessions.months} เดือน`,
		retentionKey: "quizSessions",
	},
	{
		id: "demographics",
		title: "ข้อมูลประชากร",
		items:
			"ช่วงอายุ เพศ จังหวัด ระดับการศึกษา และอาชีพ ของผู้ที่อายุ 20 ปีขึ้นไป เราไม่ถามชื่อ วันเกิด ที่อยู่ หรือเลขประจำตัว และถ้าคุณอายุต่ำกว่า 20 ปี เราไม่เก็บข้อมูลส่วนนี้เลย",
		storedIn: "ฐานข้อมูล Supabase (ตาราง survey_responses)",
		purpose: "ดูว่ากลุ่มใดควรได้รับความรู้เรื่องใดเพิ่ม เพื่อวางแผนการสื่อสาร",
		lawfulBasis: "consent",
		retention: `${RETENTION.demographics.months} เดือน จากนั้นรวมเป็นตัวเลขสถิติรายเดือน แล้วลบข้อมูลรายคน`,
		retentionKey: "demographics",
		optional: true,
	},
	{
		id: "consent_log",
		title: "บันทึกความยินยอม",
		items: "ให้หรือถอนความยินยอมเรื่องใด เมื่อใด และภายใต้ประกาศฉบับใด (ผูกกับรหัสสุ่มเท่านั้น)",
		storedIn: "ฐานข้อมูล Supabase (ตาราง pdpa_consent_log ซึ่งเพิ่มได้อย่างเดียว แก้ไขย้อนหลังไม่ได้)",
		purpose: "พิสูจน์ว่าเราใช้ข้อมูลตามที่คุณเลือกจริง",
		lawfulBasis: "legitimate_interest",
		retention: `${RETENTION.consentLog.months / 12} ปี แล้วลบ`,
		retentionKey: "consentLog",
	},
	{
		id: "connection_logs",
		title: "ข้อมูลการเชื่อมต่อ",
		items:
			"หมายเลข IP เวลา และหน้าที่เรียกดู ในบันทึกระบบ (log) ของผู้ให้บริการโฮสต์และฐานข้อมูล ระบบออกรหัสสุ่มใช้หมายเลข IP ชั่วคราวในหน่วยความจำเพื่อจำกัดการขอรหัสซ้ำ โดยไม่บันทึกลงฐานข้อมูล",
		storedIn: "Vercel และ Supabase (ผู้ประมวลผลข้อมูลของเรา)",
		purpose: "ดูแลความปลอดภัย ป้องกันการโจมตี และแก้ไขปัญหาของระบบ",
		lawfulBasis: "legitimate_interest",
		retention:
			"ตามรอบการเก็บบันทึกระบบของผู้ให้บริการแต่ละราย ซึ่งเป็นระยะสั้น และเราไม่นำมาใช้ระบุตัวบุคคล",
	},
] as const satisfies readonly DataCategory[];

// ---------------------------------------------------------------------------------------------
// Browser storage (what the public site keeps on the visitor's device)
// ---------------------------------------------------------------------------------------------

export type ClientStorageArea = "localStorage" | "sessionStorage";

export type ClientStorageEntry = {
	key: string;
	area: ClientStorageArea;
	contains: string;
	purpose: string;
	lifetime: string;
	/** Written only by an earlier version of the site; still cleared on erasure. */
	legacy?: boolean;
};

/**
 * Keys the public site stores on the device. Keep in sync with lib/services/anon-jwt.service.ts
 * (CACHE_KEY) and lib/services/anonymous-user.service.ts (STORAGE_KEY); a unit test checks both.
 * The public site sets no cookies: Supabase Auth cookies (`sb-…-auth-token`) and `sidebar_state`
 * exist only for staff signed in to the management portal.
 */
export const CLIENT_STORAGE = [
	{
		key: "anon_jwt_cache",
		area: "sessionStorage",
		contains: "รหัสผู้ใช้แบบสุ่ม และโทเค็นยืนยันตัวตนแบบไม่ระบุชื่อ",
		purpose: "ให้คำตอบในรอบเดียวกันถูกบันทึกต่อกัน และใช้ยืนยันเมื่อคุณขอลบข้อมูล",
		lifetime: `จนกว่าจะปิดแท็บ หรือครบ ${ANON_TOKEN_TTL_HOURS} ชั่วโมง`,
	},
	{
		key: "scan_jone_anonymous_user",
		area: "localStorage",
		contains: "รหัสผู้ใช้แบบสุ่ม และข้อมูลอุปกรณ์ (ขนาดหน้าจอ ภาษา เขตเวลา) จากเว็บไซต์เวอร์ชันก่อน",
		purpose: "เวอร์ชันปัจจุบันไม่สร้างข้อมูลนี้แล้ว",
		lifetime: "อยู่จนกว่าคุณจะกด “ลบข้อมูลของฉัน” หรือล้างข้อมูลเบราว์เซอร์",
		legacy: true,
	},
] as const satisfies readonly ClientStorageEntry[];

export type ClientStorageKeys = {
	localStorage: string[];
	sessionStorage: string[];
};

/** Every key "ลบข้อมูลของฉัน" clears on this device. */
export function erasableClientKeys(): ClientStorageKeys {
	const keys: ClientStorageKeys = { localStorage: [], sessionStorage: [] };
	for (const entry of CLIENT_STORAGE) keys[entry.area].push(entry.key);
	return keys;
}

// ---------------------------------------------------------------------------------------------
// Recipients / processors and cross-border transfer (s.23(4), s.28–29)
// ---------------------------------------------------------------------------------------------

export type Processor = {
	id: string;
	name: string;
	role: string;
	location: string;
};

export const PROCESSORS = [
	{
		id: "supabase",
		name: "Supabase",
		role: "ฐานข้อมูล และบริการออกรหัสผู้ใช้แบบสุ่ม",
		location: "ศูนย์ข้อมูลตามภูมิภาคที่ผู้ดูแลระบบตั้งค่า (แนะนำสิงคโปร์)",
	},
	{
		id: "vercel",
		name: "Vercel",
		role: "โฮสต์เว็บไซต์ เซิร์ฟเวอร์ประมวลผลคำขอ และเครือข่ายส่งเนื้อหา (CDN)",
		location:
			"เซิร์ฟเวอร์ประมวลผลตามภูมิภาคที่ผู้ดูแลระบบตั้งค่า (แนะนำสิงคโปร์) และเครือข่าย CDN หลายประเทศ",
	},
] as const satisfies readonly Processor[];

// ---------------------------------------------------------------------------------------------
// Controller and contact (s.23(5)–(6))
// ---------------------------------------------------------------------------------------------

export type ControllerDetails = {
	name: string | null;
	address: string | null;
	email: string | null;
	/** Data protection officer (s.41), when one is appointed. */
	dpoEmail: string | null;
};

/**
 * Controller details for the notice. Never guess these: until the owners confirm them, the notice
 * shows CONTACT_FALLBACK in their place.
 */
export const CONTROLLER: ControllerDetails = {
	// Required: the person or team that runs the project (a named individual can be the controller).
	name: "ธนาคารแห่งประเทศไทย",
	// Optional: leave null when there is no postal address to publish; the row is then hidden.
	address: "สำนักงานใหญ่ 273 ถนนสามเสน แขวงวัดสามพระยา เขตพระนคร กรุงเทพฯ 10200",
	// Required: an inbox someone reads, for data subject requests.
	email: "contact@bot.or.th",
	// Optional: only when a DPO is appointed (s.41); the row is hidden otherwise.
	dpoEmail: null,
};

/** Shown wherever a controller detail is not configured yet. */
export const CONTACT_FALLBACK = "โปรดติดต่อผู้ดูแลระบบ";

/** A controller detail for display, or CONTACT_FALLBACK when it is unset or blank. */
export function controllerValue(value: string | null | undefined): string {
	const trimmed = value?.trim();
	return trimmed ? trimmed : CONTACT_FALLBACK;
}

/**
 * True once the notice can name who is responsible and how to reach them (s.23(5)): a name and an
 * email. The postal address and DPO are optional and hidden on the page when unset.
 */
export function isControllerConfigured(controller: ControllerDetails = CONTROLLER): boolean {
	return Boolean(controller.name?.trim() && controller.email?.trim());
}

/**
 * Blocks a production deployment while the controller details are missing: the notice would go
 * live without the identity and contact channel PDPA s.23(5) requires, and the rights section
 * would point to a channel that does not exist. next.config.ts calls this, so `next build` fails
 * on Vercel production (VERCEL_ENV=production) until CONTROLLER is filled in; previews and local
 * builds keep working with CONTACT_FALLBACK.
 */
export function assertControllerConfiguredForProduction(
	env: Record<string, string | undefined>,
	controller: ControllerDetails = CONTROLLER,
): void {
	if (env.VERCEL_ENV !== "production" || isControllerConfigured(controller)) return;
	throw new Error(
		"[privacy] CONTROLLER in lib/privacy/policy.ts is not filled in (name, email). " +
			"The privacy notice cannot go to production without the data controller's identity and " +
			"contact channel (PDPA s.23(5)). Fill in the project owner's name and a contact email.",
	);
}

/** Supervisory authority for complaints (s.73). */
export const SUPERVISORY_AUTHORITY = {
	name: "สำนักงานคณะกรรมการคุ้มครองข้อมูลส่วนบุคคล (สคส.)",
	url: "https://www.pdpc.or.th",
} as const;
