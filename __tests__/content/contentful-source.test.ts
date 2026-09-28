jest.mock("server-only", () => ({}));

import {
	ContentfulContentSource,
	contentfulConfigFromEnv,
	mapContentfulQuiz,
	type ContentfulConfig,
} from "@/lib/content/contentful-source";
import { ContentConfigError, ContentSourceError } from "@/lib/content/source";
import {
	CONTENTFUL_QUIZ_LIST_RESPONSE,
	CONTENTFUL_QUIZ_RESPONSE,
} from "./fixtures/contentful-quiz";

const CONFIG: ContentfulConfig = {
	spaceId: "space123",
	deliveryToken: "cda-token_123",
	environment: "master",
	locales: {},
};

type FetchCall = { url: URL; init: RequestInit };

function fakeFetch(body: unknown, status = 200) {
	const calls: FetchCall[] = [];
	const fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
		calls.push({ url: new URL(String(input)), init: init ?? {} });
		return new Response(JSON.stringify(body), {
			status,
			headers: { "Content-Type": "application/vnd.contentful.delivery.v1+json" },
		});
	});
	return { fetch: fetch as unknown as typeof globalThis.fetch, calls, mock: fetch };
}

describe("mapContentfulQuiz + validation (ContentfulContentSource.getQuiz)", () => {
	let consoleError: jest.SpyInstance;

	beforeEach(() => {
		consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
	});

	afterEach(() => {
		consoleError.mockRestore();
	});

	it("maps quiz, questions, answers, red flags and assets to the content model", async () => {
		const { fetch } = fakeFetch(CONTENTFUL_QUIZ_RESPONSE);
		const quiz = await new ContentfulContentSource(CONFIG, { fetch }).getQuiz("scam-awareness");

		expect(quiz).toEqual({
			id: "quizEntry",
			slug: "scam-awareness",
			title: "แบบทดสอบ 10 สถานการณ์จำลอง",
			description: "ดูสถานการณ์จำลอง แล้วหาธงแดง",
			locale: "th",
			status: "published",
			version: 7,
			questions: [
				{
					id: "qPin",
					order: 1,
					prompt: "หน้าเว็บขอรหัส PIN 6 หลัก คุณจะทำอย่างไร",
					category: "หลอกให้กรอกรหัส",
					kpiCategory: "PROTECTIVE_ACTIONS",
					scenario: { kind: "pin-entry", pinLength: 6, prompt: "กรุณากรอกรหัสผ่าน" },
					answers: [
						{ id: "aPinCancel", text: "ไม่กรอกรหัส", isCorrect: true },
						{ id: "aPinConfirm", text: "ยืนยัน", isCorrect: false },
					],
					result: {
						correctTitle: "ถูกต้อง",
						wrongTitle: "ข้อนี้มีธงแดง 1 จุด",
						header: "อย่ากรอกรหัสจากลิงก์",
						explanation: "ธนาคารไม่ขอรหัส PIN ผ่านลิงก์",
					},
					redFlags: [{ number: 1, label: "ห้ามกรอกรหัสที่คุณใช้จริง", detail: "ธนาคารไม่ขอรหัสผ่านลิงก์" }],
				},
				{
					id: "qCall",
					order: 2,
					prompt: "มีสายจากเบอร์ +6972543130 อ้างเป็นตำรวจ คุณจะทำอย่างไร",
					category: "แก๊งคอลเซ็นเตอร์",
					kpiCategory: "RESPONSE_STRATEGIES",
					scenario: {
						kind: "image-pair",
						normalSrc: "https://images.ctfassets.net/space123/imgNormal/0a1b2c/normal.svg",
						resultSrc: "https://images.ctfassets.net/space123/imgResult/0a1b2c/result.svg",
						alt: "หน้าจอสายเรียกเข้าจากเบอร์ +6972543130",
					},
					answers: [
						{ id: "aCallPay", text: "โอนเงินไปตรวจสอบ", isCorrect: false },
						{ id: "aCallHangUp", text: "วางสายแล้วโทรกลับเบอร์ทางการ", isCorrect: true },
					],
					result: {
						correctTitle: "ถูกต้อง",
						wrongTitle: "ข้อนี้มีธงแดง 2 จุด",
						header: "ตำรวจจริงไม่โทรมาสั่งให้โอนเงิน",
						explanation: "วางสาย แล้วโทรสายด่วน 1441",
					},
					redFlags: [
						{ number: 1, label: "เบอร์แปลกจากต่างประเทศ", x: 50, y: 18 },
						{ number: 2, label: "ตำรวจจริงไม่โทรแจ้งข้อกล่าวหา" },
					],
				},
				{
					id: "qSms",
					order: 4,
					prompt: "SMS แจ้งพัสดุเสียหายพร้อมลิงก์ คุณจะทำอย่างไร",
					category: "",
					kpiCategory: "PROTECTIVE_ACTIONS",
					scenario: {
						kind: "sms",
						sender: "SHIPPING",
						body: "พัสดุของท่านเสียหาย bit.ly/49dvdnhm",
						evidence: [{ start: 20, end: 35, flag: 1 }],
					},
					answers: [
						{ id: "aSmsIgnore", text: "ไม่กดลิงก์", isCorrect: true },
						{ id: "aSmsClick", text: "กดลิงก์", isCorrect: false },
					],
					result: { correctTitle: "", wrongTitle: "", header: "", explanation: "อย่ากดลิงก์ที่ไม่ได้ขอ" },
					redFlags: [{ number: 1, label: "มีลิงก์แนบมา" }],
				},
			],
		});

		// The entry without a scenario is dropped and reported.
		expect(consoleError).toHaveBeenCalledTimes(1);
		expect(String(consoleError.mock.calls[0][0])).toContain("qBroken");
	});

	it("returns null for a response without the quiz", async () => {
		const { fetch } = fakeFetch({ sys: { type: "Array" }, total: 0, items: [] });
		await expect(new ContentfulContentSource(CONFIG, { fetch }).getQuiz("missing-quiz")).resolves.toBeNull();
		expect(mapContentfulQuiz({ nonsense: true }, "th")).toBeNull();
	});
});

describe("ContentfulContentSource requests", () => {
	it("queries the Delivery API with the token and cache tags", async () => {
		const { fetch, calls } = fakeFetch(CONTENTFUL_QUIZ_RESPONSE);
		jest.spyOn(console, "error").mockImplementation(() => {});
		await new ContentfulContentSource(CONFIG, { fetch }).getQuiz("scam-awareness");
		jest.restoreAllMocks();

		expect(calls).toHaveLength(1);
		const { url, init } = calls[0];
		expect(url.origin).toBe("https://cdn.contentful.com");
		expect(url.pathname).toBe("/spaces/space123/environments/master/entries");
		expect(Object.fromEntries(url.searchParams)).toEqual({
			content_type: "quiz",
			"fields.slug": "scam-awareness",
			include: "3",
			limit: "1",
		});
		expect(url.searchParams.has("access_token")).toBe(false);
		expect(init.headers).toEqual({ Authorization: "Bearer cda-token_123" });
		expect(init.next).toEqual({ tags: ["content", "content:quiz:scam-awareness"], revalidate: 3600 });
	});

	it("sends the Contentful locale when one is configured, and falls back when it is not", async () => {
		const withThai = fakeFetch({ items: [] });
		await new ContentfulContentSource({ ...CONFIG, locales: { th: "th-TH" } }, { fetch: withThai.fetch }).getQuiz(
			"scam-awareness",
			{ locale: "en" },
		);
		expect(withThai.calls[0].url.searchParams.get("locale")).toBe("th-TH");

		const withEnglish = fakeFetch({ items: [] });
		await new ContentfulContentSource(
			{ ...CONFIG, locales: { th: "th-TH", en: "en-US" } },
			{ fetch: withEnglish.fetch },
		).getQuiz("scam-awareness", { locale: "en" });
		expect(withEnglish.calls[0].url.searchParams.get("locale")).toBe("en-US");
	});

	it("does not call the API for an invalid slug", async () => {
		const { fetch, mock } = fakeFetch(CONTENTFUL_QUIZ_RESPONSE);
		await expect(new ContentfulContentSource(CONFIG, { fetch }).getQuiz("../../spaces")).resolves.toBeNull();
		expect(mock).not.toHaveBeenCalled();
	});

	it("reports a bad token or space as a config error, other failures as source errors", async () => {
		const unauthorized = fakeFetch({ message: "The access token you sent could not be found or is invalid." }, 401);
		await expect(
			new ContentfulContentSource(CONFIG, { fetch: unauthorized.fetch }).getQuiz("scam-awareness"),
		).rejects.toBeInstanceOf(ContentConfigError);

		const unavailable = fakeFetch({ message: "Service unavailable" }, 503);
		const failure = new ContentfulContentSource(CONFIG, { fetch: unavailable.fetch }).getQuiz("scam-awareness");
		await expect(failure).rejects.toBeInstanceOf(ContentSourceError);
		await expect(failure).rejects.not.toBeInstanceOf(ContentConfigError);
		await expect(failure).rejects.toThrow("503 (Service unavailable)");

		const offline = jest.fn(async () => {
			throw new TypeError("fetch failed");
		}) as unknown as typeof globalThis.fetch;
		await expect(
			new ContentfulContentSource(CONFIG, { fetch: offline }).getQuiz("scam-awareness"),
		).rejects.toBeInstanceOf(ContentSourceError);
	});

	it("never puts the token in error messages", async () => {
		const unauthorized = fakeFetch({ message: "nope" }, 401);
		await expect(
			new ContentfulContentSource(CONFIG, { fetch: unauthorized.fetch }).getQuiz("scam-awareness"),
		).rejects.toMatchObject({ message: expect.not.stringContaining("cda-token_123") });
	});

	it("lists quizzes with their question counts", async () => {
		const { fetch, calls } = fakeFetch(CONTENTFUL_QUIZ_LIST_RESPONSE);
		const quizzes = await new ContentfulContentSource(CONFIG, { fetch }).listQuizzes();

		expect(quizzes).toEqual([
			{
				id: "quizEntry",
				slug: "scam-awareness",
				title: "แบบทดสอบ 10 สถานการณ์จำลอง",
				description: "ดูสถานการณ์จำลอง แล้วหาธงแดง",
				locale: "th",
				status: "published",
				version: 7,
				questionCount: 2,
			},
		]);
		expect(calls[0].url.searchParams.get("content_type")).toBe("quiz");
		expect(calls[0].init.next).toEqual({ tags: ["content", "content:quizzes"], revalidate: 3600 });
	});
});

describe("contentfulConfigFromEnv", () => {
	const env = {
		CONTENT_SOURCE: "contentful",
		CONTENTFUL_SPACE_ID: "space123",
		CONTENTFUL_DELIVERY_TOKEN: "cda-token_123",
	};

	it("reads the settings, defaulting the environment to master", () => {
		expect(contentfulConfigFromEnv(env)).toEqual({ ...CONFIG, locales: {} });
		expect(
			contentfulConfigFromEnv({
				...env,
				CONTENTFUL_ENVIRONMENT: "staging",
				CONTENTFUL_LOCALE_TH: "th-TH",
			}),
		).toEqual({ ...CONFIG, environment: "staging", locales: { th: "th-TH" } });
	});

	it("is enabled only with CONTENT_SOURCE=contentful", () => {
		expect(() => contentfulConfigFromEnv({ ...env, CONTENT_SOURCE: "supabase" })).toThrow(ContentConfigError);
		expect(() => contentfulConfigFromEnv({ ...env, CONTENT_SOURCE: undefined })).toThrow(
			"CONTENT_SOURCE=contentful",
		);
	});

	it("names the missing variables", () => {
		expect(() => contentfulConfigFromEnv({ CONTENT_SOURCE: "contentful" })).toThrow(
			"CONTENTFUL_SPACE_ID and CONTENTFUL_DELIVERY_TOKEN",
		);
		expect(() => contentfulConfigFromEnv({ ...env, CONTENTFUL_DELIVERY_TOKEN: "  " })).toThrow(
			/needs CONTENTFUL_DELIVERY_TOKEN/,
		);
	});

	it("rejects values that could change the request path", () => {
		expect(() => contentfulConfigFromEnv({ ...env, CONTENTFUL_SPACE_ID: "space/../x" })).toThrow(ContentConfigError);
		expect(() => contentfulConfigFromEnv({ ...env, CONTENTFUL_ENVIRONMENT: "../master" })).toThrow(ContentConfigError);
		expect(() => contentfulConfigFromEnv({ ...env, CONTENTFUL_LOCALE_EN: "en US" })).toThrow(ContentConfigError);
	});
});
