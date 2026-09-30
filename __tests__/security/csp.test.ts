import {
	buildContentSecurityPolicy,
	buildSecurityHeaders,
	toCspOrigin,
} from "@/lib/security/csp";

/** Parse "a x y; b z" into { a: ["x", "y"], b: ["z"] }. */
function parseCsp(policy: string): Record<string, string[]> {
	return Object.fromEntries(
		policy
			.split(";")
			.map((directive) => directive.trim())
			.filter(Boolean)
			.map((directive) => {
				const [name, ...sources] = directive.split(/\s+/);
				return [name, sources];
			}),
	);
}

const headerMap = (headers: { key: string; value: string }[]) =>
	Object.fromEntries(headers.map(({ key, value }) => [key, value]));

describe("buildContentSecurityPolicy (production)", () => {
	const csp = parseCsp(buildContentSecurityPolicy());

	it("locks everything to same-origin by default", () => {
		expect(csp["default-src"]).toEqual(["'self'"]);
		expect(csp["base-uri"]).toEqual(["'self'"]);
		expect(csp["form-action"]).toEqual(["'self'"]);
		expect(csp["object-src"]).toEqual(["'none'"]);
		expect(csp["frame-ancestors"]).toEqual(["'none'"]);
		expect(csp["upgrade-insecure-requests"]).toEqual([]);
	});

	it("allows only the documented script, style, image, font and connect sources", () => {
		expect(csp["script-src"]).toEqual(["'self'", "'unsafe-inline'"]);
		expect(csp["style-src"]).toEqual(["'self'", "'unsafe-inline'"]);
		expect(csp["img-src"]).toEqual(["'self'", "data:", "blob:", "https://*.supabase.co"]);
		expect(csp["font-src"]).toEqual(["'self'"]);
		expect(csp["connect-src"]).toEqual([
			"'self'",
			"https://*.supabase.co",
			"wss://*.supabase.co",
			"https://vitals.vercel-insights.com",
		]);
	});

	it("never allows eval, wildcards or http: in production", () => {
		const policy = buildContentSecurityPolicy({ vercelAnalytics: true, vercelToolbar: true });
		expect(policy).not.toContain("'unsafe-eval'");
		expect(policy).not.toMatch(/(^|\s)\*(\s|;|$)/);
		expect(policy).not.toMatch(/(^|\s)(http:|ws:)(\s|;|$)/);
	});
});

describe("buildContentSecurityPolicy options", () => {
	it("adds the Vercel analytics script host only when analytics is used", () => {
		expect(buildContentSecurityPolicy()).not.toContain("va.vercel-scripts.com");
		const csp = parseCsp(buildContentSecurityPolicy({ vercelAnalytics: true }));
		expect(csp["script-src"]).toContain("https://va.vercel-scripts.com");
	});

	it("allows the Vercel Toolbar on preview deployments", () => {
		const csp = parseCsp(buildContentSecurityPolicy({ vercelToolbar: true }));
		expect(csp["script-src"]).toContain("https://vercel.live");
		expect(csp["frame-src"]).toEqual(["'self'", "https://vercel.live"]);
		expect(csp["connect-src"]).toContain("wss://ws-us3.pusher.com");
		expect(csp["frame-ancestors"]).toEqual(["'none'"]);
	});

	it("relaxes only what next dev needs", () => {
		const csp = parseCsp(buildContentSecurityPolicy({ isDev: true }));
		expect(csp["script-src"]).toContain("'unsafe-eval'");
		expect(csp["connect-src"]).toContain("ws:");
		expect(csp["frame-ancestors"]).toBeUndefined();
		expect(csp["upgrade-insecure-requests"]).toBeUndefined();
		expect(csp["object-src"]).toEqual(["'none'"]);
	});

	it("adds a custom Supabase origin (and its websocket) but not a *.supabase.co one twice", () => {
		const local = parseCsp(buildContentSecurityPolicy({ supabaseUrl: "http://127.0.0.1:54321/" }));
		expect(local["connect-src"]).toEqual(
			expect.arrayContaining(["http://127.0.0.1:54321", "ws://127.0.0.1:54321"]),
		);
		expect(local["img-src"]).toContain("http://127.0.0.1:54321");

		const hosted = buildContentSecurityPolicy({ supabaseUrl: "https://abc.supabase.co" });
		expect(hosted).not.toContain("https://abc.supabase.co");
	});

	it("ignores malformed origins instead of injecting directives", () => {
		const policy = buildContentSecurityPolicy({
			supabaseUrl: "javascript:alert(1)",
			extraImgSrc: ["https://images.ctfassets.net/path", "not a url; script-src *"],
		});
		const csp = parseCsp(policy);
		expect(csp["img-src"]).toContain("https://images.ctfassets.net");
		expect(policy).not.toContain("javascript:");
		expect(policy).not.toContain("not a url");
		expect(Object.keys(csp).filter((name) => name === "script-src")).toHaveLength(1);
	});
});

describe("toCspOrigin", () => {
	it("keeps only http(s) origins", () => {
		expect(toCspOrigin("https://x.supabase.co/rest/v1")).toBe("https://x.supabase.co");
		expect(toCspOrigin("ftp://x.test")).toBeNull();
		expect(toCspOrigin("")).toBeNull();
		expect(toCspOrigin(undefined)).toBeNull();
	});
});

describe("buildSecurityHeaders", () => {
	it("sends the full hardened set in production", () => {
		const headers = headerMap(buildSecurityHeaders());
		expect(headers).toEqual({
			"Content-Security-Policy": expect.stringContaining("default-src 'self'"),
			"Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
			"X-Frame-Options": "DENY",
			"X-Content-Type-Options": "nosniff",
			"Referrer-Policy": "strict-origin-when-cross-origin",
			"Permissions-Policy": "camera=(), microphone=(), geolocation=(), browsing-topics=()",
			"Cross-Origin-Opener-Policy": "same-origin",
		});
	});

	it("omits HSTS and frame blocking in development", () => {
		const headers = headerMap(buildSecurityHeaders({ isDev: true }));
		expect(headers["Strict-Transport-Security"]).toBeUndefined();
		expect(headers["X-Frame-Options"]).toBeUndefined();
		expect(headers["X-Content-Type-Options"]).toBe("nosniff");
	});
});
