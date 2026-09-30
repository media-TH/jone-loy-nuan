import type { ComponentProps, ReactNode } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ResultView, type ReviewQuestion } from "@/app/(main)/result/_components/result-view";
import { lineShareHref } from "@/components/share/share-links";
import { shareScoreUrl } from "@/lib/seo/share";

type Response = { questionId: string; questionOrder: number; isCorrect: boolean };

const mockStore = { responses: [] as Response[], totalQuestions: 0, resetQuiz: jest.fn() };

jest.mock("@/store/quiz-store", () => {
	const getState = () => ({
		...mockStore,
		getSummary: () => {
			const score = mockStore.responses.filter((response) => response.isCorrect).length;
			return { score, total: mockStore.totalQuestions, percentage: 0 };
		},
	});
	const useQuizResultStore = Object.assign(
		(selector: (state: ReturnType<typeof getState>) => unknown) => selector(getState()),
		{ getState },
	);
	return { useQuizResultStore };
});

jest.mock("@/components/motion/scan-transition", () => ({
	TransitionLink: ({ children, ...props }: ComponentProps<"a"> & { children: ReactNode }) => (
		<a {...props}>{children}</a>
	),
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const QUESTIONS: ReviewQuestion[] = [
	{
		id: "q2",
		order: 2,
		category: "แก๊งคอลเซ็นเตอร์",
		title: "ตำรวจจริงไม่โทรมาสั่งให้โอนเงิน",
		redFlags: [
			{ number: 1, label: "เบอร์ขึ้นต้นด้วย +697" },
			{ number: 2, label: "สั่งให้โอนเงินไปตรวจสอบ", detail: "ตำรวจจริงไม่มีขั้นตอนนี้" },
		],
	},
];

let container: HTMLDivElement;
let root: Root;

const renderView = () => act(() => root.render(<ResultView questions={QUESTIONS} />));

beforeEach(() => {
	mockStore.responses = [];
	mockStore.totalQuestions = 0;
	mockStore.resetQuiz.mockClear();
	container = document.createElement("div");
	document.body.appendChild(container);
	root = createRoot(container);
});

afterEach(() => {
	act(() => root.unmount());
	container.remove();
});

it("shows a friendly empty state with a way into the quiz when there is no result", () => {
	renderView();

	expect(container.querySelector("h1")?.textContent).toBe("ยังไม่มีผลการสแกนในแท็บนี้");
	expect(container.querySelector('a[href="/quiz"]')).not.toBeNull();
});

it("lists each missed question once, in quiz order, with its title and red flags", () => {
	mockStore.totalQuestions = 10;
	mockStore.responses = [
		{ questionId: "q5", questionOrder: 5, isCorrect: false },
		{ questionId: "q1", questionOrder: 1, isCorrect: true },
		{ questionId: "q2", questionOrder: 2, isCorrect: false },
		{ questionId: "q2", questionOrder: 2, isCorrect: false },
	];
	renderView();

	const items = Array.from(container.querySelectorAll('section[aria-labelledby="missed-title"] > ol > li'));
	expect(items).toHaveLength(2);

	// Known content: title, category and the numbered red flags.
	expect(items[0].querySelector("h3")?.textContent).toBe("ตำรวจจริงไม่โทรมาสั่งให้โอนเงิน");
	expect(items[0].textContent).toContain("ข้อ 2 · แก๊งคอลเซ็นเตอร์");
	expect(items[0].querySelectorAll('[data-slot="ds-red-flag-list"] li')).toHaveLength(2);

	// Unknown content: just the question number, nothing invented.
	expect(items[1].querySelector("h3")?.textContent).toBe("ข้อ 5");
	expect(items[1].querySelector('[data-slot="ds-red-flag-list"]')).toBeNull();
});

it("shares the score-only link and resets the quiz before playing again", () => {
	mockStore.totalQuestions = 10;
	mockStore.responses = [
		{ questionId: "q1", questionOrder: 1, isCorrect: true },
		{ questionId: "q2", questionOrder: 2, isCorrect: false },
	];
	renderView();

	expect(container.querySelector("h1")?.textContent).toBe("คุณเสี่ยงตกเป็นเหยื่อมิจฉาชีพ");
	expect(container.querySelector(`a[href="${lineShareHref(shareScoreUrl(1, 10))}"]`)).not.toBeNull();
	expect(shareScoreUrl(1, 10)).toMatch(/\/s\/1$/);

	const again = Array.from(container.querySelectorAll('a[href="/quiz"]')).find((link) =>
		link.textContent?.includes("ทำแบบทดสอบอีกครั้ง"),
	) as HTMLAnchorElement;
	act(() => again.click());
	expect(mockStore.resetQuiz).toHaveBeenCalledTimes(1);
	// The page keeps showing the result it mounted with while the wipe covers it.
	expect(container.querySelector("h1")?.textContent).toBe("คุณเสี่ยงตกเป็นเหยื่อมิจฉาชีพ");
});

it("links the tel: hotlines with the numbers visible", () => {
	mockStore.totalQuestions = 10;
	mockStore.responses = [{ questionId: "q1", questionOrder: 1, isCorrect: true }];
	renderView();

	expect(container.querySelector('a[href="tel:1441"]')?.textContent).toContain("1441");
	expect(container.querySelector('a[href="tel:1213"]')?.textContent).toContain("1213");
});
