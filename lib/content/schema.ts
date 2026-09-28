/**
 * Runtime validation for the content model in lib/content/types.ts.
 *
 * Every schema mirrors its type one to one (the tests assert the inferred types are identical),
 * so content from any source is checked at the boundary before the quiz renders it.
 */

import { z } from "zod";
import {
	CHAT_APPS,
	KPI_CATEGORIES,
	LOCALES,
	QUIZ_STATUSES,
	type Answer,
	type EvidenceRange,
	type Question,
	type QuestionResult,
	type Quiz,
	type QuizSummary,
	type RedFlag,
	type Scenario,
} from "@/lib/content/types";

/** Lowercase words joined by single hyphens, e.g. "scam-awareness". */
const QUIZ_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const QUIZ_SLUG_MAX_LENGTH = 64;

export function isValidQuizSlug(slug: unknown): slug is string {
	return (
		typeof slug === "string" &&
		slug.length <= QUIZ_SLUG_MAX_LENGTH &&
		QUIZ_SLUG_PATTERN.test(slug)
	);
}

/**
 * Image sources the quiz may render: a root-relative path ("/images/...") or an https URL.
 * Rejects protocol-relative ("//host"), data:, javascript: and plain http URLs.
 */
export function isSafeAssetSrc(src: string): boolean {
	if (src.startsWith("/")) {
		return !src.startsWith("//") && !src.startsWith("/\\");
	}
	try {
		return new URL(src).protocol === "https:";
	} catch {
		return false;
	}
}

const text = z.string().trim().min(1);
const percent = z.number().finite().min(0).max(100);

export const evidenceRangeSchema = z
	.object({
		start: z.number().int().min(0),
		end: z.number().int().min(0),
		flag: z.number().int().min(1),
	})
	.refine((range) => range.end > range.start, {
		message: "end must be greater than start",
		path: ["end"],
	}) satisfies z.ZodType<EvidenceRange, z.ZodTypeDef, unknown>;

const assetSrc = text.refine(isSafeAssetSrc, {
	message: 'must be a root-relative path ("/...") or an https URL',
});

const imagePairScenarioSchema = z.object({
	kind: z.literal("image-pair"),
	normalSrc: assetSrc,
	resultSrc: assetSrc,
	alt: text,
});

const pinEntryScenarioSchema = z.object({
	kind: z.literal("pin-entry"),
	pinLength: z.number().int().min(4).max(12),
	prompt: text,
});

const chatScenarioSchema = z.object({
	kind: z.literal("chat"),
	app: z.enum(CHAT_APPS),
	messages: z
		.array(
			z.object({
				from: z.enum(["them", "me"]),
				text,
				evidence: z.array(evidenceRangeSchema).optional(),
			}),
		)
		.min(1),
});

const callScenarioSchema = z.object({
	kind: z.literal("call"),
	caller: text,
	number: text,
	duration: z.number().int().min(0).optional(),
});

const smsScenarioSchema = z.object({
	kind: z.literal("sms"),
	sender: text,
	body: text,
	evidence: z.array(evidenceRangeSchema).optional(),
});

export const scenarioSchema = z.discriminatedUnion("kind", [
	imagePairScenarioSchema,
	pinEntryScenarioSchema,
	chatScenarioSchema,
	callScenarioSchema,
	smsScenarioSchema,
]) satisfies z.ZodType<Scenario, z.ZodTypeDef, unknown>;

export const answerSchema = z.object({
	id: text,
	text,
	isCorrect: z.boolean(),
}) satisfies z.ZodType<Answer, z.ZodTypeDef, unknown>;

export const questionResultSchema = z.object({
	correctTitle: z.string(),
	wrongTitle: z.string(),
	header: z.string(),
	explanation: z.string(),
}) satisfies z.ZodType<QuestionResult, z.ZodTypeDef, unknown>;

export const redFlagSchema = z
	.object({
		number: z.number().int().min(1),
		label: text,
		detail: text.optional(),
		x: percent.optional(),
		y: percent.optional(),
	})
	.refine((flag) => (flag.x === undefined) === (flag.y === undefined), {
		message: "x and y must be set together",
		path: ["x"],
	}) satisfies z.ZodType<RedFlag, z.ZodTypeDef, unknown>;

/** Evidence ranges of a scenario, wherever that kind keeps them. */
function scenarioEvidence(scenario: Scenario): EvidenceRange[] {
	switch (scenario.kind) {
		case "chat":
			return scenario.messages.flatMap((message) => message.evidence ?? []);
		case "sms":
			return scenario.evidence ?? [];
		default:
			return [];
	}
}

function findDuplicate<T>(values: readonly T[]): T | undefined {
	const seen = new Set<T>();
	for (const value of values) {
		if (seen.has(value)) return value;
		seen.add(value);
	}
	return undefined;
}

export const questionSchema = z
	.object({
		id: text,
		order: z.number().int().min(1),
		prompt: text,
		category: z.string(),
		kpiCategory: z.enum(KPI_CATEGORIES),
		scenario: scenarioSchema,
		answers: z.array(answerSchema),
		result: questionResultSchema,
		redFlags: z.array(redFlagSchema),
	})
	.superRefine((question, ctx) => {
		const { answers, redFlags, scenario } = question;
		const hasCorrect = answers.some((answer) => answer.isCorrect);

		// A pin-entry screen carries its own two actions, so legacy content may have no answers.
		if (scenario.kind !== "pin-entry" && answers.length < 2) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["answers"],
				message: "needs at least 2 answers",
			});
		}
		if (answers.length > 0 && !hasCorrect) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["answers"],
				message: "needs at least 1 correct answer",
			});
		}

		const duplicateAnswer = findDuplicate(answers.map((answer) => answer.id));
		if (duplicateAnswer !== undefined) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["answers"],
				message: `duplicate answer id "${duplicateAnswer}"`,
			});
		}

		const flagNumbers = redFlags.map((flag) => flag.number);
		const duplicateFlag = findDuplicate(flagNumbers);
		if (duplicateFlag !== undefined) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["redFlags"],
				message: `duplicate red flag number ${duplicateFlag}`,
			});
		}

		for (const range of scenarioEvidence(scenario)) {
			if (!flagNumbers.includes(range.flag)) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ["scenario"],
					message: `evidence points at red flag ${range.flag}, which the question does not have`,
				});
			}
		}
	}) satisfies z.ZodType<Question, z.ZodTypeDef, unknown>;

const quizFields = {
	id: text,
	slug: z.string().refine(isValidQuizSlug, { message: "invalid quiz slug" }),
	title: text,
	description: z.string(),
	locale: z.enum(LOCALES),
	status: z.enum(QUIZ_STATUSES),
	version: z.number().int().min(1),
};

export const quizSchema = z.object({
	...quizFields,
	questions: z.array(questionSchema),
}) satisfies z.ZodType<Quiz, z.ZodTypeDef, unknown>;

export const quizSummarySchema = z.object({
	...quizFields,
	questionCount: z.number().int().min(0),
}) satisfies z.ZodType<QuizSummary, z.ZodTypeDef, unknown>;

/** Flattens zod issues into "path: message" lines for logs and errors. */
export function formatIssues(error: z.ZodError): string[] {
	return error.issues.map((issue) =>
		issue.path.length > 0 ? `${issue.path.join(".")}: ${issue.message}` : issue.message,
	);
}

/**
 * Validates scenario data of unknown shape (a jsonb column, a CMS JSON field).
 * Returns `fallback` (or null without one) instead of throwing when the data is not a valid scenario.
 */
export function parseScenario(input: unknown): Scenario | null;
export function parseScenario(input: unknown, fallback: Scenario): Scenario;
export function parseScenario(input: unknown, fallback: Scenario | null = null): Scenario | null {
	if (input === null || input === undefined) return fallback;
	const parsed = scenarioSchema.safeParse(input);
	return parsed.success ? parsed.data : fallback;
}

export type DroppedQuestion = {
	index: number;
	id?: string;
	issues: string[];
};

export type QuizValidationResult =
	| { success: true; quiz: Quiz; dropped: DroppedQuestion[] }
	| { success: false; issues: string[] };

/**
 * Validates a whole quiz. Questions are checked one by one: an invalid or duplicate question is
 * dropped (and reported in `dropped`) so one bad CMS entry cannot take the whole quiz down.
 * Fails only when the quiz itself (id, slug, title, ...) is invalid.
 */
export function validateQuiz(input: unknown): QuizValidationResult {
	const envelope = quizSchema.extend({ questions: z.array(z.unknown()) }).safeParse(input);
	if (!envelope.success) {
		return { success: false, issues: formatIssues(envelope.error) };
	}

	const questions: Question[] = [];
	const dropped: DroppedQuestion[] = [];
	const seenIds = new Set<string>();

	envelope.data.questions.forEach((raw, index) => {
		const parsed = questionSchema.safeParse(raw);
		if (!parsed.success) {
			const id = (raw as { id?: unknown } | null)?.id;
			dropped.push({
				index,
				id: typeof id === "string" ? id : undefined,
				issues: formatIssues(parsed.error),
			});
			return;
		}
		if (seenIds.has(parsed.data.id)) {
			dropped.push({ index, id: parsed.data.id, issues: ["duplicate question id"] });
			return;
		}
		seenIds.add(parsed.data.id);
		questions.push(parsed.data);
	});

	questions.sort((a, b) => a.order - b.order);
	return { success: true, quiz: { ...envelope.data, questions }, dropped };
}
