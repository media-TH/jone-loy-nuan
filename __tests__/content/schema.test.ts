import type { z } from "zod";
import {
	isSafeAssetSrc,
	isValidQuizSlug,
	parseScenario,
	questionSchema,
	quizSchema,
	quizSummarySchema,
	redFlagSchema,
	scenarioSchema,
	validateQuiz,
} from "@/lib/content/schema";
import {
	isRenderableScenario,
	type Question,
	type Quiz,
	type QuizSummary,
	type RedFlag,
	type Scenario,
} from "@/lib/content/types";

// Compile-time: every schema infers exactly its hand-written type (tsc fails otherwise).
type Exact<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
const schemasMirrorTypes: [
	Exact<z.infer<typeof scenarioSchema>, Scenario>,
	Exact<z.infer<typeof redFlagSchema>, RedFlag>,
	Exact<z.infer<typeof questionSchema>, Question>,
	Exact<z.infer<typeof quizSchema>, Quiz>,
	Exact<z.infer<typeof quizSummarySchema>, QuizSummary>,
] = [true, true, true, true, true];

const pin: Scenario = { kind: "pin-entry", pinLength: 6, prompt: "กรุณากรอกรหัสผ่าน" };
const imagePair: Scenario = {
	kind: "image-pair",
	normalSrc: "/images/scenarios/question-2/normal.svg",
	resultSrc: "/images/scenarios/question-2/result.svg",
	alt: "หน้าจอสายเรียกเข้า",
};

function question(overrides: Partial<Question> = {}): Question {
	return {
		id: "q2",
		order: 2,
		prompt: "คุณจะทำอย่างไร",
		category: "แก๊งคอลเซ็นเตอร์",
		kpiCategory: "RESPONSE_STRATEGIES",
		scenario: imagePair,
		answers: [
			{ id: "a1", text: "วางสาย", isCorrect: true },
			{ id: "a2", text: "โอนเงิน", isCorrect: false },
		],
		result: { correctTitle: "ถูกต้อง", wrongTitle: "ข้อนี้มีธงแดง 1 จุด", header: "h", explanation: "e" },
		redFlags: [{ number: 1, label: "เบอร์ต่างประเทศ" }],
		...overrides,
	};
}

function quiz(questions: unknown[]): unknown {
	return {
		id: "quiz-1",
		slug: "scam-awareness",
		title: "แบบทดสอบ",
		description: "",
		locale: "th",
		status: "published",
		version: 1,
		questions,
	};
}

describe("content schema", () => {
	it("mirrors the content types", () => {
		expect(schemasMirrorTypes).toEqual([true, true, true, true, true]);
	});

	describe("parseScenario", () => {
		it("accepts every scenario kind", () => {
			const scenarios: Scenario[] = [
				imagePair,
				pin,
				{
					kind: "chat",
					app: "line",
					messages: [
						{ from: "them", text: "โอนแล้วแจ้งสลิปด้วยครับ", evidence: [{ start: 0, end: 7, flag: 1 }] },
						{ from: "me", text: "ได้ครับ" },
					],
				},
				{ kind: "call", caller: "ไม่ทราบชื่อ", number: "+6972543130", duration: 105 },
				{ kind: "sms", sender: "Kerry", body: "พัสดุเสียหาย bit.ly/49dvdnhm", evidence: [{ start: 14, end: 28, flag: 1 }] },
			];
			for (const scenario of scenarios) {
				expect(parseScenario(scenario)).toEqual(scenario);
			}
		});

		it("returns null, or the fallback, for anything else", () => {
			expect(parseScenario(null)).toBeNull();
			expect(parseScenario(undefined, pin)).toBe(pin);
			expect(parseScenario({ kind: "hologram" }, pin)).toBe(pin);
			expect(parseScenario({ kind: "pin-entry", pinLength: 2, prompt: "x" })).toBeNull();
			expect(parseScenario({ kind: "chat", app: "line", messages: [] })).toBeNull();
			expect(parseScenario("pin-entry", imagePair)).toBe(imagePair);
		});

		it("rejects unsafe image sources", () => {
			for (const src of ["javascript:alert(1)", "//evil.example/x.svg", "http://example.com/x.svg", "data:image/svg+xml,<svg/>"]) {
				expect(parseScenario({ ...imagePair, normalSrc: src })).toBeNull();
			}
		});

		it("rejects empty or reversed evidence ranges", () => {
			expect(parseScenario({ kind: "sms", sender: "x", body: "abc", evidence: [{ start: 2, end: 2, flag: 1 }] })).toBeNull();
			expect(parseScenario({ kind: "sms", sender: "x", body: "abc", evidence: [{ start: 2, end: 1, flag: 1 }] })).toBeNull();
		});
	});

	it("isSafeAssetSrc allows root-relative paths and https URLs only", () => {
		expect(isSafeAssetSrc("/images/a.svg")).toBe(true);
		expect(isSafeAssetSrc("https://images.ctfassets.net/space/a.svg")).toBe(true);
		expect(isSafeAssetSrc("images/a.svg")).toBe(false);
		expect(isSafeAssetSrc("/\\evil.example")).toBe(false);
	});

	it("isValidQuizSlug accepts lowercase hyphenated slugs only", () => {
		expect(isValidQuizSlug("scam-awareness")).toBe(true);
		expect(isValidQuizSlug("quiz2026")).toBe(true);
		for (const slug of ["", "Scam", "scam--awareness", "-scam", "scam/../x", "a".repeat(65), 42]) {
			expect(isValidQuizSlug(slug)).toBe(false);
		}
	});

	it("requires red flag x and y together, within 0–100", () => {
		expect(redFlagSchema.safeParse({ number: 1, label: "x", x: 10, y: 90 }).success).toBe(true);
		expect(redFlagSchema.safeParse({ number: 1, label: "x", x: 10 }).success).toBe(false);
		expect(redFlagSchema.safeParse({ number: 1, label: "x", x: 10, y: 101 }).success).toBe(false);
		expect(redFlagSchema.safeParse({ number: 0, label: "x" }).success).toBe(false);
	});

	describe("questionSchema", () => {
		it("accepts a well-formed question", () => {
			expect(questionSchema.safeParse(question()).success).toBe(true);
		});

		it("needs two answers and a correct one, except on the PIN screen", () => {
			expect(questionSchema.safeParse(question({ answers: [{ id: "a1", text: "x", isCorrect: true }] })).success).toBe(false);
			expect(
				questionSchema.safeParse(
					question({
						answers: [
							{ id: "a1", text: "x", isCorrect: false },
							{ id: "a2", text: "y", isCorrect: false },
						],
					}),
				).success,
			).toBe(false);
			expect(questionSchema.safeParse(question({ scenario: pin, answers: [] })).success).toBe(true);
		});

		it("rejects duplicate answer ids and red flag numbers", () => {
			const answers = [
				{ id: "a1", text: "x", isCorrect: true },
				{ id: "a1", text: "y", isCorrect: false },
			];
			expect(questionSchema.safeParse(question({ answers })).success).toBe(false);
			const redFlags = [
				{ number: 1, label: "x" },
				{ number: 1, label: "y" },
			];
			expect(questionSchema.safeParse(question({ redFlags })).success).toBe(false);
		});

		it("rejects evidence that points at a missing red flag", () => {
			const scenario: Scenario = { kind: "sms", sender: "x", body: "abcdef", evidence: [{ start: 0, end: 3, flag: 2 }] };
			expect(questionSchema.safeParse(question({ scenario })).success).toBe(false);
		});
	});

	describe("validateQuiz", () => {
		it("drops invalid and duplicate questions and sorts the rest by order", () => {
			const result = validateQuiz(
				quiz([
					question({ id: "q3", order: 3 }),
					question({ id: "broken", order: 1, prompt: "" }),
					question({ id: "q2", order: 2 }),
					question({ id: "q2", order: 4 }),
				]),
			);

			expect(result.success).toBe(true);
			if (!result.success) return;
			expect(result.quiz.questions.map((q) => q.id)).toEqual(["q2", "q3"]);
			expect(result.dropped).toEqual([
				{ index: 1, id: "broken", issues: [expect.stringContaining("prompt")] },
				{ index: 3, id: "q2", issues: ["duplicate question id"] },
			]);
		});

		it("fails when the quiz itself is invalid", () => {
			const result = validateQuiz({ ...(quiz([]) as object), slug: "Not A Slug" });
			expect(result.success).toBe(false);
		});
	});

	it("isRenderableScenario is true for image-pair and pin-entry only", () => {
		expect(isRenderableScenario(imagePair)).toBe(true);
		expect(isRenderableScenario(pin)).toBe(true);
		expect(isRenderableScenario({ kind: "call", caller: "x", number: "1" })).toBe(false);
	});
});
