import { existsSync } from "fs";
import path from "path";
import { FixtureContentSource, SAMPLE_QUIZ } from "@/lib/content/fixture-source";
import { LEGACY_PIN_RED_FLAG, LEGACY_PIN_SCENARIO } from "@/lib/content/legacy";
import { quizSchema } from "@/lib/content/schema";
import { DEFAULT_QUIZ_ID, DEFAULT_QUIZ_SLUG } from "@/lib/content/source";

const publicFile = (src: string) => path.join(process.cwd(), "public", src);

describe("FixtureContentSource (sample preview content)", () => {
	it("validates against the content schema as a whole", () => {
		const parsed = quizSchema.safeParse(SAMPLE_QUIZ);
		if (!parsed.success) throw parsed.error;
		expect(parsed.data).toEqual(SAMPLE_QUIZ);
	});

	it("is the default quiz with 10 questions in order", () => {
		expect(SAMPLE_QUIZ.id).toBe(DEFAULT_QUIZ_ID);
		expect(SAMPLE_QUIZ.slug).toBe(DEFAULT_QUIZ_SLUG);
		expect(SAMPLE_QUIZ.locale).toBe("th");
		expect(SAMPLE_QUIZ.status).toBe("published");
		expect(SAMPLE_QUIZ.questions.map((question) => question.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
		expect(new Set(SAMPLE_QUIZ.questions.map((question) => question.id)).size).toBe(10);
	});

	it("mirrors today's scenarios: PIN first, then the bundled image pairs", () => {
		const [first, ...rest] = SAMPLE_QUIZ.questions;
		expect(first.scenario).toEqual(LEGACY_PIN_SCENARIO);
		expect(first.redFlags).toEqual([LEGACY_PIN_RED_FLAG]);

		for (const question of rest) {
			expect(question.scenario).toEqual({
				kind: "image-pair",
				normalSrc: `/images/scenarios/question-${question.order}/normal.svg`,
				resultSrc: `/images/scenarios/question-${question.order}/result.svg`,
				alt: expect.any(String),
			});
			if (question.scenario.kind !== "image-pair") continue;
			expect(existsSync(publicFile(question.scenario.normalSrc))).toBe(true);
			expect(existsSync(publicFile(question.scenario.resultSrc))).toBe(true);
		}
	});

	it("has exactly one correct answer, red flags and complete result copy per question", () => {
		for (const question of SAMPLE_QUIZ.questions) {
			expect(question.answers.filter((answer) => answer.isCorrect)).toHaveLength(1);
			expect(question.redFlags.length).toBeGreaterThan(0);
			expect(question.result.wrongTitle).toBe(`ข้อนี้มีธงแดง ${question.redFlags.length} จุด`);
			for (const copy of Object.values(question.result)) {
				expect(copy.trim()).not.toBe("");
			}
			// Image-pair flags are drawn into result.svg, so none is placed a second time.
			expect(question.redFlags.every((flag) => flag.x === undefined && flag.y === undefined)).toBe(true);
		}
	});

	it("covers every KPI the campaign reports on", () => {
		const counts = SAMPLE_QUIZ.questions.reduce<Record<string, number>>((acc, question) => {
			acc[question.kpiCategory] = (acc[question.kpiCategory] ?? 0) + 1;
			return acc;
		}, {});
		// Same split as the kpi_targets seed in 01-create-scam-awareness-schema.sql.
		expect(counts).toEqual({
			SCAM_RECOGNITION: 3,
			RISK_ASSESSMENT: 2,
			PROTECTIVE_ACTIONS: 3,
			RESPONSE_STRATEGIES: 2,
		});
	});

	it("serves the default quiz only, as a copy", async () => {
		const source = new FixtureContentSource();
		const quiz = await source.getQuiz(DEFAULT_QUIZ_SLUG);
		expect(quiz).toEqual(SAMPLE_QUIZ);
		expect(quiz).not.toBe(SAMPLE_QUIZ);

		quiz!.questions[0].prompt = "changed";
		expect(SAMPLE_QUIZ.questions[0].prompt).not.toBe("changed");

		await expect(source.getQuiz("another-quiz")).resolves.toBeNull();
		await expect(source.getQuiz("Not a slug")).resolves.toBeNull();
	});

	it("lists the default quiz", async () => {
		const { questions, ...meta } = SAMPLE_QUIZ;
		await expect(new FixtureContentSource().listQuizzes()).resolves.toEqual([
			{ ...meta, questionCount: questions.length },
		]);
	});
});
