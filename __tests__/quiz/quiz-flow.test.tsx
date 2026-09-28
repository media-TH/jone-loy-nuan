import { MotionGlobalConfig } from "motion/react";
import type { ComponentProps, ReactNode } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QuizClient } from "@/app/(main)/quiz/_components/quiz-client";
import { MotionProvider } from "@/components/motion/motion-provider";
import { SCENARIO_RENDERERS, scenarioAnswersItself } from "@/components/quiz/scenario-registry";
import { placedRedFlags } from "@/components/quiz/types";
import { SAMPLE_QUIZ } from "@/lib/content/fixture-source";
import { QUIZ_COMPLETE_HREF } from "@/hooks/useQuiz";
import { SCENARIO_KINDS, type Question } from "@/lib/content/types";
import { getAnonToken } from "@/lib/services/anon-jwt.service";
import { QuizService } from "@/lib/services/quiz.service";
import { useQuizResultStore } from "@/store/quiz-store";

const mockPush = jest.fn();

jest.mock("@/components/motion/scan-transition", () => ({
	TransitionLink: ({ children, ...props }: ComponentProps<"a"> & { children: ReactNode }) => (
		<a {...props}>{children}</a>
	),
	useTransitionRouter: () => ({ push: mockPush, replace: jest.fn(), isTransitioning: false }),
}));

jest.mock("@/lib/services/quiz.service", () => ({
	QuizService: {
		getDeviceInfo: jest.fn(() => ({ type: "mobile", userAgent: "jest" })),
		createSession: jest.fn(),
		updateSession: jest.fn(),
		submitQuizResponse: jest.fn(),
	},
}));

jest.mock("@/lib/services/anon-jwt.service", () => ({ getAnonToken: jest.fn() }));

const mockService = jest.mocked(QuizService);
const mockAnonToken = jest.mocked(getAnonToken);

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
MotionGlobalConfig.skipAnimations = true;
// jsdom does not implement scrolling.
window.scrollTo = jest.fn() as typeof window.scrollTo;
Element.prototype.scrollIntoView = jest.fn();

const QUESTIONS: Question[] = [
	{
		id: "q-pin",
		order: 1,
		prompt: "หน้าเว็บขอรหัส PIN คุณจะทำอย่างไร",
		category: "หลอกให้กรอกรหัส",
		kpiCategory: "PROTECTIVE_ACTIONS",
		scenario: { kind: "pin-entry", pinLength: 4, prompt: "กรุณากรอกรหัสผ่าน" },
		answers: [
			{ id: "a-safe", text: "ไม่กรอกรหัส", isCorrect: true },
			{ id: "a-unsafe", text: "ยืนยัน", isCorrect: false },
		],
		result: { correctTitle: "ถูกต้อง คุณไม่กรอกรหัส", wrongTitle: "", header: "", explanation: "" },
		redFlags: [{ number: 1, label: "ห้ามกรอกรหัสที่ใช้จริง" }],
	},
	{
		id: "q-call",
		order: 2,
		prompt: "มีสายจากเบอร์แปลก คุณจะทำอย่างไร",
		category: "แก๊งคอลเซ็นเตอร์",
		kpiCategory: "RESPONSE_STRATEGIES",
		scenario: {
			kind: "image-pair",
			normalSrc: "/images/scenarios/question-2/normal.svg",
			resultSrc: "/images/scenarios/question-2/result.svg",
			alt: "หน้าจอสายเรียกเข้า",
		},
		answers: [
			{ id: "b1", text: "โอนเงินให้ตรวจสอบ", isCorrect: false },
			{ id: "b2", text: "วางสายแล้วโทรกลับเอง", isCorrect: true },
			{ id: "b3", text: "ให้เลขบัญชีไปก่อน", isCorrect: false },
		],
		result: {
			correctTitle: "ถูกต้อง วางสายแล้วตรวจสอบเอง",
			wrongTitle: "ข้อนี้มีธงแดง 2 จุด",
			header: "ตำรวจจริงไม่โทรมาสั่งให้โอนเงิน",
			explanation: "เบอร์ที่ขึ้นต้นด้วย + คือสายจากต่างประเทศ",
		},
		redFlags: [
			{ number: 1, label: "เบอร์ต่างประเทศ", x: 50, y: 20 },
			{ number: 2, label: "สั่งให้โอนเงิน" },
		],
	},
	{
		id: "q-sms",
		order: 3,
		prompt: "SMS แจ้งพัสดุเสียหาย คุณจะกดลิงก์ไหม",
		category: "SMS หลอกลวง",
		kpiCategory: "PROTECTIVE_ACTIONS",
		scenario: { kind: "sms", sender: "KERRY", body: "พัสดุเสียหาย กดเคลม bit.ly/x" },
		answers: [
			{ id: "c1", text: "กดลิงก์", isCorrect: false },
			{ id: "c2", text: "ไม่กด", isCorrect: true },
		],
		result: { correctTitle: "ถูกต้อง", wrongTitle: "", header: "", explanation: "" },
		redFlags: [],
	},
];

let container: HTMLDivElement;
let root: Root;

const render = (questions: Question[] = QUESTIONS) =>
	act(() =>
		root.render(
			<MotionProvider>
				<QuizClient questions={questions} />
			</MotionProvider>,
		),
	);

const heading = () => container.querySelector("h1");
const options = () => Array.from(container.querySelectorAll<HTMLButtonElement>('[data-slot="ds-answer-option"]'));
const sheet = () => document.querySelector<HTMLElement>('[data-slot="ds-result-sheet"]');

function buttonByText(text: string, scope: ParentNode = document): HTMLButtonElement {
	const button = Array.from(scope.querySelectorAll("button")).find((element) =>
		element.textContent?.includes(text),
	);
	if (!button) throw new Error(`no button with "${text}"`);
	return button;
}

const click = (element: HTMLElement) => act(() => element.click());

/** Lets the result sheet rise (the reveal beat) and any exit finish. */
const settle = () =>
	act(async () => {
		jest.advanceTimersByTime(1000);
		await Promise.resolve();
	});

async function answerPinSafely() {
	await click(buttonByText("ไม่กรอกรหัส", container));
	await settle();
}

async function goNext(label = "ข้อต่อไป") {
	await click(buttonByText(label, sheet() ?? document));
	await settle();
}

beforeEach(() => {
	jest.useFakeTimers();
	jest.clearAllMocks();
	useQuizResultStore.getState().resetQuiz();
	mockService.createSession.mockResolvedValue({ success: true, anonymous_user_id: "user_from_session" });
	mockService.updateSession.mockResolvedValue({ success: true });
	mockService.submitQuizResponse.mockResolvedValue(undefined);
	mockAnonToken.mockResolvedValue({ token: "anon.jwt.token", anon_user_id: "anon-1" });
	container = document.createElement("div");
	document.body.appendChild(container);
	root = createRoot(container);
});

afterEach(() => {
	act(() => root.unmount());
	container.remove();
	jest.useRealTimers();
});

describe("scenario registry", () => {
	it("has a renderer for every scenario kind; only the PIN screen answers itself", () => {
		for (const kind of SCENARIO_KINDS) {
			expect(SCENARIO_RENDERERS[kind].Component).toBeDefined();
		}
		expect(QUESTIONS.map((question) => scenarioAnswersItself(question.scenario))).toEqual([
			true,
			false,
			false,
		]);
	});

	it("pins only the red flags that have coordinates, in number order", () => {
		expect(
			placedRedFlags([
				{ number: 3, label: "c", x: 10, y: 90 },
				{ number: 2, label: "b" },
				{ number: 1, label: "a", x: 80, y: 5 },
			]),
		).toEqual([
			{ number: 1, label: "a", x: 80, y: 5 },
			{ number: 3, label: "c", x: 10, y: 90 },
		]);
	});
});

describe("quiz flow", () => {
	it("starts one session and renders the first question's PIN screen without an answer list", async () => {
		await render();

		expect(mockService.createSession).toHaveBeenCalledTimes(1);
		expect(mockService.createSession.mock.calls[0][0]).toMatchObject({ totalQuestions: 3 });
		expect(heading()?.textContent).toBe(QUESTIONS[0].prompt);
		expect(container.textContent).toContain("ข้อ 1 / 3");
		expect(options()).toHaveLength(0);
	});

	it("does not confirm an incomplete PIN, and records refusing to enter it as correct", async () => {
		await render();

		await click(buttonByText("ยืนยัน", container));
		expect(container.textContent).toContain("กรอกรหัสให้ครบ 4 หลัก");
		expect(useQuizResultStore.getState().responses).toHaveLength(0);

		await answerPinSafely();

		expect(useQuizResultStore.getState().responses).toEqual([
			expect.objectContaining({
				questionId: "q-pin",
				answerId: "a-safe",
				isCorrect: true,
				kpiCategoryId: "PROTECTIVE_ACTIONS",
				questionOrder: 1,
			}),
		]);
		expect(sheet()?.getAttribute("data-verdict")).toBe("correct");
		expect(document.activeElement?.id).toBe("quiz-result-title");
	});

	it("locks the answer, reveals the right one and opens the sheet with the result copy", async () => {
		await render();
		await answerPinSafely();
		await goNext();

		expect(heading()?.textContent).toBe(QUESTIONS[1].prompt);
		expect(document.activeElement).toBe(heading());
		expect(options().map((option) => option.textContent?.slice(0, 1))).toEqual(["ก", "ข", "ค"]);

		await click(options()[0]);
		await click(options()[1]);

		expect(options().map((option) => option.dataset.state)).toEqual(["wrong", "correct", "dimmed"]);
		expect(useQuizResultStore.getState().responses).toHaveLength(2);
		expect(container.querySelectorAll('[data-slot="ds-red-flag-pin"]')).toHaveLength(1);
		expect(sheet()).toBeNull();

		await settle();

		expect(sheet()?.getAttribute("data-verdict")).toBe("wrong");
		expect(sheet()?.textContent).toContain("ข้อนี้มีธงแดง 2 จุด");
		expect(sheet()?.textContent).toContain("ตำรวจจริงไม่โทรมาสั่งให้โอนเงิน");
		expect(sheet()?.querySelectorAll("ol li")).toHaveLength(2);
	});

	it("selects an answer with the number keys", async () => {
		await render();
		await answerPinSafely();
		await goNext();

		await act(() => {
			window.dispatchEvent(new KeyboardEvent("keydown", { key: "2", code: "Digit2", bubbles: true }));
		});

		expect(useQuizResultStore.getState().responses.at(-1)).toMatchObject({
			questionId: "q-call",
			answerId: "b2",
			isCorrect: true,
		});
	});

	it("submits the summary once and then goes to the survey", async () => {
		await render();
		await answerPinSafely();
		await goNext();
		await click(options()[1]);
		await settle();
		await goNext();
		await click(options()[0]);
		await settle();

		const finish = buttonByText("ดูผลลัพธ์", sheet()!);
		await act(async () => {
			finish.click();
			finish.click();
		});
		await settle();

		expect(mockService.submitQuizResponse).toHaveBeenCalledTimes(1);
		expect(mockService.submitQuizResponse).toHaveBeenCalledWith(
			expect.objectContaining({
				total_questions: 3,
				correct_answers: 2,
				device_fingerprint: "mobile",
				anonymous_user_id: "user_from_session",
				token: "anon.jwt.token",
			}),
		);
		expect(mockPush).toHaveBeenCalledTimes(1);
		expect(mockPush).toHaveBeenCalledWith(QUIZ_COMPLETE_HREF);
	});

	it("still reaches the survey when saving the summary fails", async () => {
		const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
		mockAnonToken.mockRejectedValue(new Error("NEXT_PUBLIC_SUPABASE_URL is required for anon JWT"));
		await render();
		await answerPinSafely();
		await goNext();
		await click(options()[1]);
		await settle();
		await goNext();
		await click(options()[1]);
		await settle();

		await click(buttonByText("ดูผลลัพธ์", sheet()!));
		await settle();

		expect(mockService.submitQuizResponse).not.toHaveBeenCalled();
		expect(mockPush).toHaveBeenCalledWith(QUIZ_COMPLETE_HREF);
		expect(consoleError).toHaveBeenCalledWith("Failed to save quiz summary:", expect.any(Error));
		consoleError.mockRestore();
	});

	it("plays the whole local preview quiz (CONTENT_SOURCE=fixture) through to the survey", async () => {
		const questions = SAMPLE_QUIZ.questions;
		await render(questions);

		for (const [index, question] of questions.entries()) {
			expect(heading()?.textContent).toBe(question.prompt);
			expect(container.textContent).toContain(`ข้อ ${index + 1} / ${questions.length}`);
			if (scenarioAnswersItself(question.scenario)) {
				await answerPinSafely();
			} else {
				expect(options()).toHaveLength(question.answers.length);
				await click(options()[0]);
				await settle();
			}
			expect(sheet()).not.toBeNull();
			await goNext(index === questions.length - 1 ? "ดูผลลัพธ์" : "ข้อต่อไป");
		}

		expect(useQuizResultStore.getState().responses).toHaveLength(questions.length);
		expect(mockService.submitQuizResponse).toHaveBeenCalledTimes(1);
		expect(mockPush).toHaveBeenCalledWith(QUIZ_COMPLETE_HREF);
	});
});
