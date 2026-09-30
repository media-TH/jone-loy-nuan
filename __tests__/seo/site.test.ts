import {
	isIndexableDeployment,
	isIndexableHost,
	normalizeHost,
	resolveSiteUrl,
} from "@/lib/seo/site";

const REAL_HOST = "xn--12co4czb5a2kj.online";

describe("resolveSiteUrl", () => {
	it("falls back to the real site when unset, blank or malformed", () => {
		expect(resolveSiteUrl(undefined).origin).toBe(`https://${REAL_HOST}`);
		expect(resolveSiteUrl("  ").origin).toBe(`https://${REAL_HOST}`);
		expect(resolveSiteUrl("not a url").origin).toBe(`https://${REAL_HOST}`);
		expect(resolveSiteUrl("javascript:alert(1)").origin).toBe(`https://${REAL_HOST}`);
	});

	it("keeps only the origin of an http(s) URL", () => {
		expect(resolveSiteUrl("https://example.org/some/path?q=1").toString()).toBe("https://example.org/");
	});

	it("converts a Unicode domain to punycode", () => {
		expect(resolveSiteUrl("https://สแกนโจร.online").hostname).toBe(REAL_HOST);
	});
});

describe("normalizeHost", () => {
	it("strips ports and case, and accepts full URLs", () => {
		expect(normalizeHost("Example.COM:443")).toBe("example.com");
		expect(normalizeHost("https://example.com/path")).toBe("example.com");
		expect(normalizeHost("สแกนโจร.online")).toBe(REAL_HOST);
	});

	it("returns null for empty input", () => {
		expect(normalizeHost(null)).toBeNull();
		expect(normalizeHost("")).toBeNull();
	});
});

describe("isIndexableDeployment", () => {
	it("is false outside Vercel production", () => {
		expect(isIndexableDeployment({})).toBe(false);
		expect(isIndexableDeployment({ VERCEL_ENV: "preview" })).toBe(false);
		expect(isIndexableDeployment({ VERCEL_ENV: "development" })).toBe(false);
	});

	it("is true on production with an explicit site URL", () => {
		expect(
			isIndexableDeployment({ VERCEL_ENV: "production", NEXT_PUBLIC_SITE_URL: "https://example.org" }),
		).toBe(true);
	});

	it("without a site URL, requires Vercel's production domain to be the real host", () => {
		expect(
			isIndexableDeployment({ VERCEL_ENV: "production", VERCEL_PROJECT_PRODUCTION_URL: REAL_HOST }),
		).toBe(true);
		expect(
			isIndexableDeployment({
				VERCEL_ENV: "production",
				VERCEL_PROJECT_PRODUCTION_URL: "some-fork.vercel.app",
			}),
		).toBe(false);
		expect(isIndexableDeployment({ VERCEL_ENV: "production" })).toBe(true);
	});
});

describe("isIndexableHost", () => {
	const production = { VERCEL_ENV: "production", NEXT_PUBLIC_SITE_URL: `https://${REAL_HOST}` };

	it("allows only the canonical host on production", () => {
		expect(isIndexableHost(REAL_HOST, production)).toBe(true);
		expect(isIndexableHost(`${REAL_HOST}:443`, production)).toBe(true);
		expect(isIndexableHost("project-git-main.vercel.app", production)).toBe(false);
		expect(isIndexableHost(`www.${REAL_HOST}`, production)).toBe(false);
		expect(isIndexableHost(null, production)).toBe(false);
	});

	it("never allows a preview deployment, even on the canonical host", () => {
		expect(isIndexableHost(REAL_HOST, { ...production, VERCEL_ENV: "preview" })).toBe(false);
	});

	it("compares against the configured site URL", () => {
		const fork = { VERCEL_ENV: "production", NEXT_PUBLIC_SITE_URL: "https://fork.example" };
		expect(isIndexableHost("fork.example", fork)).toBe(true);
		expect(isIndexableHost(REAL_HOST, fork)).toBe(false);
	});
});
