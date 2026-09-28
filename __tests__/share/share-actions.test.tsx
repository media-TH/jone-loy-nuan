import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ShareActions } from "@/components/share/share-actions";
import { facebookShareHref, lineShareHref, scoreShareText } from "@/components/share/share-links";

const URL_TO_SHARE = "https://xn--12co4czb5a2kj.online/s/7";

describe("share links", () => {
	it("builds the LINE share dialog URL with the link encoded", () => {
		expect(lineShareHref(URL_TO_SHARE)).toBe(
			"https://social-plugins.line.me/lineit/share?url=https%3A%2F%2Fxn--12co4czb5a2kj.online%2Fs%2F7",
		);
	});

	it("builds the Facebook sharer URL with the link encoded", () => {
		expect(facebookShareHref(URL_TO_SHARE)).toBe(
			"https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fxn--12co4czb5a2kj.online%2Fs%2F7",
		);
	});

	it("puts only the score in the share text", () => {
		expect(scoreShareText(7)).toContain("7/10");
	});
});

describe("<ShareActions>", () => {
	(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

	let container: HTMLDivElement;
	let root: Root;
	const originalShare = Object.getOwnPropertyDescriptor(navigator, "share");
	const originalClipboard = Object.getOwnPropertyDescriptor(navigator, "clipboard");
	const originalSecureContext = Object.getOwnPropertyDescriptor(window, "isSecureContext");

	const render = () =>
		act(() => {
			root.render(<ShareActions url={URL_TO_SHARE} title="สแกนโจร.online" text="ลองดู" />);
		});

	const button = (name: string) =>
		Array.from(container.querySelectorAll("button")).find((element) =>
			element.textContent?.includes(name),
		);

	beforeEach(() => {
		container = document.createElement("div");
		document.body.appendChild(container);
		root = createRoot(container);
	});

	afterEach(() => {
		act(() => root.unmount());
		container.remove();
		if (originalShare) Object.defineProperty(navigator, "share", originalShare);
		else delete (navigator as { share?: unknown }).share;
		if (originalClipboard) Object.defineProperty(navigator, "clipboard", originalClipboard);
		else delete (navigator as { clipboard?: unknown }).clipboard;
		if (originalSecureContext) Object.defineProperty(window, "isSecureContext", originalSecureContext);
		else delete (window as { isSecureContext?: unknown }).isSecureContext;
		delete (document as { execCommand?: unknown }).execCommand;
		jest.restoreAllMocks();
	});

	it("links to LINE and Facebook in a new tab", () => {
		render();
		const hrefs = Array.from(container.querySelectorAll("a")).map((link) => [
			link.getAttribute("href"),
			link.getAttribute("target"),
			link.getAttribute("rel"),
		]);
		expect(hrefs).toEqual([
			[lineShareHref(URL_TO_SHARE), "_blank", "noopener noreferrer"],
			[facebookShareHref(URL_TO_SHARE), "_blank", "noopener noreferrer"],
		]);
	});

	it("offers the native share sheet only when the browser has one", async () => {
		render();
		expect(button("แชร์")).toBeUndefined();

		act(() => root.unmount());
		root = createRoot(container);
		const share = jest.fn().mockResolvedValue(undefined);
		Object.defineProperty(navigator, "share", { configurable: true, value: share });
		render();

		const shareButton = button("แชร์");
		expect(shareButton).toBeDefined();
		await act(async () => shareButton?.click());
		expect(share).toHaveBeenCalledWith({ title: "สแกนโจร.online", text: "ลองดู", url: URL_TO_SHARE });
	});

	it("copies with the Clipboard API and says so in the status line", async () => {
		const writeText = jest.fn().mockResolvedValue(undefined);
		Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
		Object.defineProperty(window, "isSecureContext", { configurable: true, value: true });
		render();

		await act(async () => button("คัดลอกลิงก์")?.click());

		expect(writeText).toHaveBeenCalledWith(URL_TO_SHARE);
		expect(container.querySelector('[role="status"]')?.textContent).toContain("คัดลอกลิงก์แล้ว");
	});

	it("shows the link to copy by hand when every copy method fails", async () => {
		Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });
		Object.defineProperty(document, "execCommand", {
			configurable: true,
			value: jest.fn().mockReturnValue(false),
		});
		render();

		await act(async () => button("คัดลอกลิงก์")?.click());

		const status = container.querySelector('[role="status"]');
		expect(status?.textContent).toContain("คัดลอกอัตโนมัติไม่ได้");
		expect(status?.querySelector("input")?.value).toBe(URL_TO_SHARE);
	});
});
