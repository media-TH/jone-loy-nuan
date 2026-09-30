/**
 * @jest-environment ./__tests__/security/support/native-fetch-environment.ts
 */
import { NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

const SUPABASE_URL = "https://abcd.supabase.co";
const ENV_KEYS = [
	"NEXT_PUBLIC_SUPABASE_URL",
	"NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY",
	"NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

/** A Supabase SSR session cookie (base64url-encoded JSON) that is not yet expired. */
function sessionCookie(): string {
	const now = Math.floor(Date.now() / 1000);
	const session = {
		access_token: "header.payload.signature",
		refresh_token: "refresh-token",
		token_type: "bearer",
		expires_in: 3600,
		expires_at: now + 3600,
		user: { id: "5b8f0c1e-1111-4a2b-9c3d-000000000001", aud: "authenticated" },
	};
	const base64url = btoa(JSON.stringify(session)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
	return `base64-${base64url}`;
}

function request(pathname: string, withSession = false): NextRequest {
	const headers = new Headers();
	if (withSession) headers.set("cookie", `sb-abcd-auth-token=${sessionCookie()}`);
	return new NextRequest(new URL(pathname, "https://xn--12co4czb5a2kj.online"), { headers });
}

const isRedirectToLogin = (response: Response) =>
	response.status === 307 && new URL(response.headers.get("location") ?? "").pathname === "/login";
const isPassThrough = (response: Response) => response.headers.get("x-middleware-next") === "1";

describe("updateSession", () => {
	const saved: Partial<Record<(typeof ENV_KEYS)[number], string>> = {};
	let fetchSpy: jest.SpyInstance;
	let warnSpy: jest.SpyInstance;
	let errorSpy: jest.SpyInstance;

	beforeEach(() => {
		for (const key of ENV_KEYS) {
			saved[key] = process.env[key];
			delete process.env[key];
		}
		fetchSpy = jest.spyOn(global, "fetch");
		warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
		errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
	});

	afterEach(() => {
		for (const key of ENV_KEYS) {
			if (saved[key] === undefined) delete process.env[key];
			else process.env[key] = saved[key];
		}
		fetchSpy.mockRestore();
		warnSpy.mockRestore();
		errorSpy.mockRestore();
	});

	const configure = () => {
		process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_URL;
		process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY = "sb_publishable_test";
	};

	describe("without Supabase env (local preview)", () => {
		it("serves public pages without touching the network", async () => {
			const response = await updateSession(request("/quiz", true));
			expect(isPassThrough(response)).toBe(true);
			expect(fetchSpy).not.toHaveBeenCalled();
		});

		it("keeps the admin area closed", async () => {
			const response = await updateSession(request("/mgmt-portal/dashboard"));
			expect(isRedirectToLogin(response)).toBe(true);
			expect(new URL(response.headers.get("location") ?? "").searchParams.get("redirectTo")).toBe(
				"/mgmt-portal/dashboard",
			);
		});
	});

	describe("with Supabase env", () => {
		beforeEach(configure);

		it("skips the auth round-trip for anonymous visitors", async () => {
			const response = await updateSession(request("/"));
			expect(isPassThrough(response)).toBe(true);
			expect(fetchSpy).not.toHaveBeenCalled();
		});

		it("redirects the admin area to /login when there is no session cookie", async () => {
			expect(isRedirectToLogin(await updateSession(request("/mgmt-portal")))).toBe(true);
			expect(fetchSpy).not.toHaveBeenCalled();
		});

		it("never blocks a public page on a Supabase network error", async () => {
			fetchSpy.mockRejectedValue(new TypeError("fetch failed"));
			const response = await updateSession(request("/result", true));
			expect(isPassThrough(response)).toBe(true);
		});

		it("fails closed for the admin area on a Supabase network error", async () => {
			fetchSpy.mockRejectedValue(new TypeError("fetch failed"));
			expect(isRedirectToLogin(await updateSession(request("/mgmt-portal", true)))).toBe(true);
		});

		it("lets a verified admin session through", async () => {
			fetchSpy.mockResolvedValue(
				new Response(
					JSON.stringify({ id: "5b8f0c1e-1111-4a2b-9c3d-000000000001", aud: "authenticated" }),
					{ status: 200, headers: { "Content-Type": "application/json" } },
				),
			);
			const response = await updateSession(request("/mgmt-portal", true));
			expect(isPassThrough(response)).toBe(true);
			expect(String(fetchSpy.mock.calls[0]?.[0])).toBe(`${SUPABASE_URL}/auth/v1/user`);
		});

		it(
			"gives up on a Supabase that never answers instead of hanging the request",
			async () => {
				// A fetch that only settles when aborted.
				fetchSpy.mockImplementation(
					(_input: RequestInfo | URL, init?: RequestInit) =>
						new Promise<Response>((_, reject) => {
							init?.signal?.addEventListener("abort", () => reject(init.signal?.reason));
						}),
				);
				const startedAt = Date.now();
				const response = await updateSession(request("/", true));
				expect(isPassThrough(response)).toBe(true);
				expect(Date.now() - startedAt).toBeLessThan(6_000);
			},
			10_000,
		);
	});
});
