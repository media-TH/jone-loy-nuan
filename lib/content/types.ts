/**
 * Content model for quizzes, independent of where the content is stored.
 *
 * Every content source (Supabase, Contentful, the local preview fixture) maps its own records to
 * these types, and the quiz UI only ever sees these types. Runtime validation lives next door in
 * lib/content/schema.ts (zod schemas that mirror every type here one to one).
 *
 * Safe to import from client components: this module holds types and plain constants only.
 */

export const LOCALES = ["th", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "th";

export const QUIZ_STATUSES = ["draft", "published"] as const;
export type QuizStatus = (typeof QUIZ_STATUSES)[number];

/** The four campaign KPIs every question reports to (questions.kpi_category in the database). */
export const KPI_CATEGORIES = [
	"SCAM_RECOGNITION",
	"RISK_ASSESSMENT",
	"PROTECTIVE_ACTIONS",
	"RESPONSE_STRATEGIES",
] as const;
export type KpiCategory = (typeof KPI_CATEGORIES)[number];

// ---------------------------------------------------------------------------
// Scenarios: what the player looks at before answering
// ---------------------------------------------------------------------------

/** A flagged range inside a piece of evidence text (same shape EvidenceText highlights take). */
export type EvidenceRange = {
	/** UTF-16 offset, inclusive (String.prototype.slice indexing). */
	start: number;
	/** UTF-16 offset, exclusive. */
	end: number;
	/** The red flag number this range belongs to (RedFlag.number). */
	flag: number;
};

/** Two illustrations: the scenario as the player first sees it, and the same scene with red flags drawn in. */
export type ImagePairScenario = {
	kind: "image-pair";
	/** Root-relative path ("/images/...") or an https URL. */
	normalSrc: string;
	/** Root-relative path ("/images/...") or an https URL. */
	resultSrc: string;
	/** Describes the scene for screen readers (used for both images). */
	alt: string;
};

/** A fake "enter your PIN" screen. Not entering the PIN is the safe (correct) choice. */
export type PinEntryScenario = {
	kind: "pin-entry";
	/** Number of PIN slots, e.g. 6. */
	pinLength: number;
	/** The screen's heading, e.g. "กรุณากรอกรหัสผ่าน". */
	prompt: string;
};

export const CHAT_APPS = ["line", "messenger", "sms"] as const;
export type ChatApp = (typeof CHAT_APPS)[number];

export type ChatMessage = {
	/** "them" = the (possible) scammer, "me" = the player. */
	from: "them" | "me";
	text: string;
	evidence?: EvidenceRange[];
};

/** A chat thread (LINE, Messenger or an SMS conversation). No renderer yet. */
export type ChatScenario = {
	kind: "chat";
	app: ChatApp;
	messages: ChatMessage[];
};

/** An incoming or ongoing phone call screen. No renderer yet. */
export type CallScenario = {
	kind: "call";
	/** Caller name as the phone shows it, e.g. "สถานีตำรวจ" or "ไม่ทราบชื่อ". */
	caller: string;
	/** Phone number as displayed, e.g. "+6972543130". */
	number: string;
	/** Elapsed call time in seconds, when the call is already connected. */
	duration?: number;
};

/** A single SMS. No renderer yet. */
export type SmsScenario = {
	kind: "sms";
	/** Sender id or number as displayed. */
	sender: string;
	body: string;
	/** Ranges inside `body`. */
	evidence?: EvidenceRange[];
};

export type Scenario =
	| ImagePairScenario
	| PinEntryScenario
	| ChatScenario
	| CallScenario
	| SmsScenario;

export type ScenarioKind = Scenario["kind"];

export const SCENARIO_KINDS = [
	"image-pair",
	"pin-entry",
	"chat",
	"call",
	"sms",
] as const satisfies readonly ScenarioKind[];

/** Scenario kinds the quiz can render today; the others are typed ahead of the next content drop. */
export const RENDERABLE_SCENARIO_KINDS = [
	"image-pair",
	"pin-entry",
] as const satisfies readonly ScenarioKind[];

export type RenderableScenario = Extract<
	Scenario,
	{ kind: (typeof RENDERABLE_SCENARIO_KINDS)[number] }
>;

export function isRenderableScenario(scenario: Scenario): scenario is RenderableScenario {
	return (RENDERABLE_SCENARIO_KINDS as readonly ScenarioKind[]).includes(scenario.kind);
}

// ---------------------------------------------------------------------------
// Questions and quizzes
// ---------------------------------------------------------------------------

export type Answer = {
	id: string;
	text: string;
	isCorrect: boolean;
};

/** Copy for the result sheet after answering. Strings may be empty when the source has none. */
export type QuestionResult = {
	correctTitle: string;
	wrongTitle: string;
	header: string;
	explanation: string;
};

/** One thing that gives the scam away, shown as a numbered red-flag pin. */
export type RedFlag = {
	/** 1-based and unique within its question. */
	number: number;
	label: string;
	/** Longer explanation under the label. */
	detail?: string;
	/** Pin anchor in percent of the scenario frame width (0–100). Set together with `y`. */
	x?: number;
	/** Pin anchor in percent of the scenario frame height (0–100). Set together with `x`. */
	y?: number;
};

export type Question = {
	id: string;
	/** 1-based position in the quiz; questions arrive sorted by it. */
	order: number;
	/** The question the player answers. */
	prompt: string;
	/** Display name of the scam type, e.g. "แก๊งคอลเซ็นเตอร์". May be empty. */
	category: string;
	kpiCategory: KpiCategory;
	scenario: Scenario;
	/**
	 * Choices for the player. For a pin-entry scenario the choices are the screen's own actions
	 * ("ไม่กรอกรหัส" = correct, "ยืนยัน" = wrong) and the list may be empty for legacy content.
	 */
	answers: Answer[];
	result: QuestionResult;
	/** Sorted by number. May be empty when the flags are drawn into the result image only. */
	redFlags: RedFlag[];
};

export type Quiz = {
	id: string;
	/** URL-safe identifier, e.g. "scam-awareness". */
	slug: string;
	title: string;
	description: string;
	locale: Locale;
	status: QuizStatus;
	/** Content revision; bumps whenever the published content changes. */
	version: number;
	/** Sorted by `order`. */
	questions: Question[];
};

export type QuizSummary = Omit<Quiz, "questions"> & {
	questionCount: number;
};
