/**
 * Maps today's database rows (get_questions_with_answers(), the rows fetchQuizQuestions returns)
 * to the content model, reproducing what the quiz has always done:
 *
 * - order_index 1 is the PIN scenario; every other question shows a normal/result image pair from
 *   content.images, or /images/scenarios/question-{order_index}/normal|result.svg without it.
 * - The PIN question carries the red flag RedFlagOverlay used to show.
 *
 * Rows written after 09-content-model.sql may also carry `scenario` and `red_flags`; when present
 * and valid they win over the order-based rules above (a null scenario keeps the legacy mapping).
 */

import { z } from "zod";
import type { Json } from "@/lib/database.types";
import { parseScenario, redFlagSchema } from "@/lib/content/schema";
import { DEFAULT_QUIZ_ID, DEFAULT_QUIZ_SLUG } from "@/lib/content/source";
import {
	KPI_CATEGORIES,
	type Answer,
	type ImagePairScenario,
	type KpiCategory,
	type PinEntryScenario,
	type Question,
	type QuestionResult,
	type Quiz,
	type RedFlag,
	type Scenario,
} from "@/lib/content/types";

/**
 * The default quiz as it exists before the quizzes table does. 09-content-model.sql inserts the
 * same values, so nothing changes for players when the migration runs.
 */
export const LEGACY_QUIZ_META: Omit<Quiz, "questions"> = {
	id: DEFAULT_QUIZ_ID,
	slug: DEFAULT_QUIZ_SLUG,
	title: "แบบทดสอบ 10 สถานการณ์จำลอง",
	description:
		"ดูสถานการณ์จำลองที่ใกล้เคียงชีวิตจริง ตัดสินใจว่าจะทำอย่างไร แล้วดูว่าธงแดงจุดไหนที่บอกว่าเป็นมิจฉาชีพ",
	locale: "th",
	status: "published",
	version: 1,
};

/** One row of get_questions_with_answers(). Wider than the generated type on purpose (see below). */
export type LegacyQuestionRow = {
	id: string;
	order_index: number | null;
	question_text: string | null;
	category?: string | null;
	/** Missing from the original 02 migration's function; defaults to SCAM_RECOGNITION. */
	kpi_category?: string | null;
	content?: Json | null;
	result?: Json | null;
	/** [{ id, answer_text, is_correct, explanation }] */
	answers?: Json | null;
	/** Added by 09-content-model.sql. */
	quiz_id?: string | null;
	/** Added by 09-content-model.sql; null = legacy mapping. */
	scenario?: Json | null;
	/** Added by 09-content-model.sql: [{ number, label, detail, x, y }] */
	red_flags?: Json | null;
};

/** Boundary check for rows from an untyped client: only the fields the mapping cannot do without. */
export const legacyQuestionRowSchema = z
	.object({
		id: z.string().min(1),
		order_index: z.number().int().nullable(),
		question_text: z.string().nullable(),
	})
	.passthrough();

/** The question that has always been rendered as the PIN screen. */
export const LEGACY_PIN_ORDER_INDEX = 1;

/** The PIN screen as pin-scenario.tsx draws it. */
export const LEGACY_PIN_SCENARIO: PinEntryScenario = {
	kind: "pin-entry",
	pinLength: 6,
	prompt: "กรุณากรอกรหัสผ่าน",
};

/**
 * What RedFlagOverlay showed on the PIN question: the pin (the text drawn in
 * /images/scenarios/question-1/redflag-pin.svg) and its note underneath.
 */
export const LEGACY_PIN_RED_FLAG: RedFlag = {
	number: 1,
	label: "ห้ามกรอกรหัสที่คุณใช้จริงเด็ดขาด!",
	detail: "แบบทดสอบนี้ไม่มีการจัดเก็บรหัสผ่านของผู้ใช้",
};

export const DEFAULT_KPI_CATEGORY: KpiCategory = "SCAM_RECOGNITION";

/** The bundled illustrations for a question position. */
export function legacyScenarioImagePaths(orderIndex: number): { normalSrc: string; resultSrc: string } {
	const base = `/images/scenarios/question-${orderIndex}`;
	return { normalSrc: `${base}/normal.svg`, resultSrc: `${base}/result.svg` };
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
	if (value === null || typeof value !== "object" || Array.isArray(value)) return undefined;
	return value as Record<string, unknown>;
}

/** Trimmed non-empty string, or undefined. */
function nonBlank(value: unknown): string | undefined {
	if (typeof value !== "string") return undefined;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : undefined;
}

/** jsonb arrays sometimes arrive JSON-encoded as a string (see transformQuestionWithAnswers). */
function asArray(value: unknown): unknown[] {
	if (typeof value === "string") {
		try {
			return asArray(JSON.parse(value));
		} catch {
			return [];
		}
	}
	return Array.isArray(value) ? value : [];
}

function legacyScenario(row: LegacyQuestionRow, order: number): Scenario {
	if (row.order_index === LEGACY_PIN_ORDER_INDEX) {
		return { ...LEGACY_PIN_SCENARIO };
	}

	const content = asRecord(row.content);
	const images = asRecord(content?.images);
	const fallback = legacyScenarioImagePaths(order);
	const scenario: ImagePairScenario = {
		kind: "image-pair",
		normalSrc: nonBlank(images?.normal) ?? fallback.normalSrc,
		resultSrc: nonBlank(images?.result) ?? fallback.resultSrc,
		alt: nonBlank(content?.alt) ?? `ภาพสถานการณ์จำลองข้อ ${order}`,
	};
	return scenario;
}

function rowScenario(row: LegacyQuestionRow, order: number): Scenario {
	const fallback = legacyScenario(row, order);
	if (row.scenario === null || row.scenario === undefined) return fallback;
	const parsed = parseScenario(row.scenario);
	if (!parsed) {
		console.warn(
			`[content:legacy] question ${row.id} has an invalid scenario; using the order-based mapping`,
		);
	}
	return parsed ?? fallback;
}

function legacyAnswers(value: unknown): Answer[] {
	const answers: Answer[] = [];
	for (const item of asArray(value)) {
		const record = asRecord(item);
		const id = record?.id;
		// DB rows use answer_text / is_correct; already-transformed rows use text / isCorrect.
		const text = nonBlank(record?.answer_text) ?? nonBlank(record?.text);
		if (typeof id !== "string" || id.length === 0 || text === undefined) continue;
		const isCorrect = record?.is_correct ?? record?.isCorrect;
		answers.push({ id, text, isCorrect: isCorrect === true });
	}
	return answers;
}

function legacyResult(value: unknown): QuestionResult {
	const record = asRecord(value);
	const field = (key: keyof QuestionResult) =>
		typeof record?.[key] === "string" ? (record[key] as string) : "";
	return {
		correctTitle: field("correctTitle"),
		wrongTitle: field("wrongTitle"),
		header: field("header"),
		explanation: field("explanation"),
	};
}

function optionalNumber(value: unknown): number | undefined {
	if (typeof value === "number") return value;
	if (typeof value === "string" && value.trim() !== "") {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : undefined;
	}
	return undefined;
}

/** red_flags rows as 09-content-model.sql returns them; the pre-09 flag_text column is accepted too. */
function tableRedFlags(value: unknown): RedFlag[] {
	const flags: RedFlag[] = [];
	for (const [index, item] of asArray(value).entries()) {
		const record = asRecord(item);
		if (!record) continue;
		const parsed = redFlagSchema.safeParse({
			number: optionalNumber(record.number) ?? index + 1,
			label: nonBlank(record.label) ?? nonBlank(record.flag_text),
			detail: nonBlank(record.detail),
			x: optionalNumber(record.x),
			y: optionalNumber(record.y),
		});
		if (parsed.success) flags.push(parsed.data);
	}
	return flags.sort((a, b) => a.number - b.number);
}

function legacyRedFlags(row: LegacyQuestionRow): RedFlag[] {
	const fromTable = tableRedFlags(row.red_flags);
	if (fromTable.length > 0) return fromTable;
	return row.order_index === LEGACY_PIN_ORDER_INDEX ? [{ ...LEGACY_PIN_RED_FLAG }] : [];
}

function kpiCategory(value: unknown): KpiCategory {
	return (KPI_CATEGORIES as readonly unknown[]).includes(value)
		? (value as KpiCategory)
		: DEFAULT_KPI_CATEGORY;
}

/** Maps one get_questions_with_answers() row to a Question (validated later by the source). */
export function legacyRowToQuestion(row: LegacyQuestionRow): Question {
	const order = row.order_index ?? 0;
	return {
		id: row.id,
		order,
		prompt: row.question_text?.trim() ?? "",
		category: row.category?.trim() ?? "",
		kpiCategory: kpiCategory(row.kpi_category),
		scenario: rowScenario(row, order),
		answers: legacyAnswers(row.answers),
		result: legacyResult(row.result),
		redFlags: legacyRedFlags(row),
	};
}

/** Sorts rows by order_index (as fetchQuizQuestions does) and maps them. */
export function legacyRowsToQuestions(rows: readonly LegacyQuestionRow[]): Question[] {
	return [...rows]
		.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
		.map(legacyRowToQuestion);
}
