import type { ComponentProps, ReactNode } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { SurveyForm } from "@/app/(main)/survey/_components/survey-form";
import { recordConsent } from "@/lib/actions/privacy";
import { submitSurveyAction } from "@/lib/actions/survey";
import { POLICY_VERSION } from "@/lib/privacy/policy";
import { getCachedAnonToken } from "@/lib/services/anon-jwt.service";

const mockPush = jest.fn();

jest.mock("@/components/motion/scan-transition", () => ({
	TransitionLink: ({ children, ...props }: ComponentProps<"a"> & { children: ReactNode }) => (
		<a {...props}>{children}</a>
	),
	useTransitionRouter: () => ({ push: mockPush, replace: jest.fn(), isTransitioning: false }),
}));

jest.mock("@/lib/actions/privacy", () => ({ recordConsent: jest.fn() }));
jest.mock("@/lib/actions/survey", () => ({ submitSurveyAction: jest.fn() }));
jest.mock("@/lib/services/anon-jwt.service", () => ({ getCachedAnonToken: jest.fn() }));

const SESSION_ID = "3f7c2b1e-9a4d-4c3b-8e2f-1a2b3c4d5e6f";

jest.mock("@/store/quiz-store", () => {
	const state = { databaseSessionId: "3f7c2b1e-9a4d-4c3b-8e2f-1a2b3c4d5e6f", responses: [] };
	const useQuizResultStore = Object.assign(
		(selector: (s: typeof state) => unknown) => selector(state),
		{ getState: () => state },
	);
	return { useQuizResultStore };
});

const mockRecordConsent = jest.mocked(recordConsent);
const mockSubmit = jest.mocked(submitSurveyAction);
const mockToken = jest.mocked(getCachedAnonToken);

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Radix measures the radio items; jsdom has no ResizeObserver.
class ResizeObserverStub {
	observe() {}
	unobserve() {}
	disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
	jest.clearAllMocks();
	mockToken.mockReturnValue({ token: "header.payload.signature", anon_user_id: "user_anon" });
	mockRecordConsent.mockResolvedValue({
		ok: true,
		purpose: "demographics",
		granted: true,
		policyVersion: POLICY_VERSION,
		changed: true,
		dataErased: 0,
		message: "บันทึกความยินยอมแล้ว",
	});
	mockSubmit.mockResolvedValue({ success: true, stored: true, code: "stored", message: "บันทึกข้อมูลแล้ว" });

	container = document.createElement("div");
	document.body.appendChild(container);
	root = createRoot(container);
	act(() => root.render(<SurveyForm />));
});

afterEach(() => {
	act(() => root.unmount());
	container.remove();
});

const radio = (label: string) =>
	Array.from(container.querySelectorAll<HTMLButtonElement>('[role="radio"]')).find(
		(element) => element.textContent === label,
	);
const consentSwitch = () => container.querySelector<HTMLInputElement>('input[role="switch"]');
const submit = async () => {
	await act(async () => {
		container.querySelector("form")?.requestSubmit();
	});
};
const sentFields = () => Object.fromEntries((mockSubmit.mock.calls[0][1] as FormData).entries());

it("goes to the result without sending anything when consent is off", async () => {
	act(() => radio("25–34 ปี")?.click());
	await submit();

	expect(mockRecordConsent).not.toHaveBeenCalled();
	expect(mockSubmit).not.toHaveBeenCalled();
	expect(mockPush).toHaveBeenCalledWith("/result");
});

it("asks for the age band once consent is on", async () => {
	act(() => consentSwitch()?.click());
	await submit();

	expect(mockSubmit).not.toHaveBeenCalled();
	expect(container.textContent).toContain("กรุณาเลือกช่วงอายุ");
	expect(document.activeElement?.getAttribute("role")).toBe("radio");
	expect(mockPush).not.toHaveBeenCalled();
});

it("records consent first, then sends the answers with the session", async () => {
	act(() => radio("25–34 ปี")?.click());
	act(() => radio("หญิง")?.click());
	act(() => consentSwitch()?.click());
	await submit();

	expect(mockRecordConsent).toHaveBeenCalledWith({
		token: "header.payload.signature",
		purpose: "demographics",
		granted: true,
		policyVersion: POLICY_VERSION,
	});
	expect(mockRecordConsent.mock.invocationCallOrder[0]).toBeLessThan(
		mockSubmit.mock.invocationCallOrder[0],
	);
	expect(sentFields()).toEqual({
		consent_demographics: "granted",
		ageBand: "25-34",
		gender: "female",
		token: "header.payload.signature",
		quizSessionId: SESSION_ID,
		policyVersion: POLICY_VERSION,
	});
	expect(mockPush).toHaveBeenCalledWith("/result");
});

it("hides the other questions for minors and sends the age band only", async () => {
	act(() => radio("หญิง")?.click());
	act(() => radio("15–19 ปี")?.click());

	expect(radio("หญิง")).toBeUndefined();
	expect(container.querySelector("select")).toBeNull();
	expect(container.textContent).toContain("อายุต่ำกว่า 20 ปี");

	act(() => consentSwitch()?.click());
	await submit();

	expect(sentFields()).toEqual({
		consent_demographics: "granted",
		ageBand: "15-19",
		token: "header.payload.signature",
		quizSessionId: SESSION_ID,
		policyVersion: POLICY_VERSION,
	});
});

it("does not send answers when the consent could not be recorded", async () => {
	mockRecordConsent.mockResolvedValue({
		ok: false,
		code: "server_error",
		message: "ระบบขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้ง",
	});
	act(() => radio("35–44 ปี")?.click());
	act(() => consentSwitch()?.click());
	await submit();

	expect(mockSubmit).not.toHaveBeenCalled();
	expect(mockPush).not.toHaveBeenCalled();
	expect(container.querySelector('[role="status"]')?.textContent).toContain("ระบบขัดข้องชั่วคราว");
});

it("explains, without sending, when this tab has no quiz session token", async () => {
	mockToken.mockReturnValue(null);
	act(() => radio("35–44 ปี")?.click());
	act(() => consentSwitch()?.click());
	await submit();

	expect(mockRecordConsent).not.toHaveBeenCalled();
	expect(mockSubmit).not.toHaveBeenCalled();
	expect(container.querySelector('[role="status"]')?.textContent).toContain("ยังไม่ได้บันทึก");
});

it("shows server field errors inline", async () => {
	mockSubmit.mockResolvedValue({
		success: false,
		stored: false,
		code: "invalid_input",
		message: "กรุณาตรวจสอบคำตอบที่ทำเครื่องหมายไว้อีกครั้ง",
		fieldErrors: { province: "กรุณาเลือกจังหวัดจากรายการ" },
	});
	act(() => radio("35–44 ปี")?.click());
	act(() => consentSwitch()?.click());
	await submit();

	expect(container.textContent).toContain("กรุณาเลือกจังหวัดจากรายการ");
	expect(document.activeElement?.id).toBe("survey-province");
	expect(mockPush).not.toHaveBeenCalled();
});
