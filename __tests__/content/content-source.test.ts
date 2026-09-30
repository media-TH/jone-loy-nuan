jest.mock("server-only", () => ({}));
jest.mock("next/cache", () => ({
	unstable_cache: jest.fn((fn: () => unknown) => fn),
	revalidateTag: jest.fn(),
}));

import {
	ContentConfigError,
	createContentSource,
	getContentSource,
	getQuiz,
	resolveContentSourceKind,
} from "@/lib/content";
import { SAMPLE_QUIZ } from "@/lib/content/fixture-source";

const SUPABASE_URL = "https://project.supabase.co";

describe("resolveContentSourceKind", () => {
	it("honours an explicit CONTENT_SOURCE", () => {
		expect(resolveContentSourceKind({ CONTENT_SOURCE: "contentful", NODE_ENV: "production" })).toBe("contentful");
		expect(resolveContentSourceKind({ CONTENT_SOURCE: " Fixture ", NODE_ENV: "production" })).toBe("fixture");
		expect(
			resolveContentSourceKind({ CONTENT_SOURCE: "supabase", NODE_ENV: "development" }),
		).toBe("supabase");
	});

	it("previews with the fixture in development when Supabase is not configured", () => {
		expect(resolveContentSourceKind({ NODE_ENV: "development" })).toBe("fixture");
		expect(resolveContentSourceKind({ NODE_ENV: "development", NEXT_PUBLIC_SUPABASE_URL: "  " })).toBe("fixture");
		expect(resolveContentSourceKind({ NODE_ENV: "development", CONTENT_SOURCE: "local" })).toBe("fixture");
	});

	it("uses Supabase when it is configured, and never picks the fixture in production on its own", () => {
		expect(resolveContentSourceKind({ NODE_ENV: "development", NEXT_PUBLIC_SUPABASE_URL: SUPABASE_URL })).toBe(
			"supabase",
		);
		expect(resolveContentSourceKind({ NODE_ENV: "production" })).toBe("supabase");
		expect(resolveContentSourceKind({ NODE_ENV: "production", CONTENT_SOURCE: "local" })).toBe("supabase");
	});

	it("warns about an unknown value and picks automatically", () => {
		const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
		expect(resolveContentSourceKind({ CONTENT_SOURCE: "wordpress", NODE_ENV: "development" })).toBe("fixture");
		expect(warn).toHaveBeenCalledWith(expect.stringContaining('unknown CONTENT_SOURCE="wordpress"'));
		warn.mockRestore();
	});
});

describe("getContentSource", () => {
	const saved = { ...process.env };

	afterEach(() => {
		process.env = { ...saved };
	});

	it("runs without any Supabase env (local preview)", async () => {
		delete process.env.NEXT_PUBLIC_SUPABASE_URL;
		delete process.env.CONTENT_SOURCE;

		expect(getContentSource().name).toBe("fixture");
		await expect(getQuiz()).resolves.toEqual(SAMPLE_QUIZ);
	});

	it("fails with a clear config error when Contentful is selected but not configured", () => {
		process.env.CONTENT_SOURCE = "contentful";
		delete process.env.CONTENTFUL_SPACE_ID;
		delete process.env.CONTENTFUL_DELIVERY_TOKEN;

		expect(() => getContentSource()).toThrow(ContentConfigError);
		expect(() => createContentSource("contentful")).toThrow("CONTENTFUL_SPACE_ID and CONTENTFUL_DELIVERY_TOKEN");
	});

	it("reuses one instance while the selection does not change", () => {
		process.env.CONTENT_SOURCE = "fixture";
		expect(getContentSource()).toBe(getContentSource());
	});
});
