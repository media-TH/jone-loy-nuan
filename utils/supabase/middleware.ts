import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Supabase Auth session refresh for proxy.ts.
 *
 * Only the management portal needs a Supabase Auth session; everything else (the quiz, learn pages,
 * privacy) is public and anonymous. So:
 *  - Public pages are never blocked: missing env, no auth cookie, a slow or unreachable Supabase —
 *    the request simply continues.
 *  - Anonymous visitors (no `sb-*-auth-token` cookie) cost zero network calls.
 *  - The admin area fails closed: no verified session -> redirect to /login.
 *  - Every call to Supabase Auth is bounded by AUTH_TIMEOUT_MS so a request can never hang.
 */

const ADMIN_PATH_PREFIX = "/mgmt-portal";
const LOGIN_PATH = "/login";
/** Upper bound for the whole Supabase Auth check (token check + refresh + retries). */
const AUTH_TIMEOUT_MS = 3_000;
/** Per-request timeout; shorter than AUTH_TIMEOUT_MS so a single slow call fails cleanly first. */
const AUTH_FETCH_TIMEOUT_MS = 2_500;

let warnedMissingEnv = false;

function getSupabasePublicEnv(): { url: string; key: string } | null {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
	// `||`, not `??`: an empty line in .env.local ("KEY=") must fall through to the other key.
	const key =
		process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY?.trim() ||
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

	if (!url || !key) return null;
	return { url, key };
}

function isAdminPath(pathname: string): boolean {
	return pathname === ADMIN_PATH_PREFIX || pathname.startsWith(`${ADMIN_PATH_PREFIX}/`);
}

/** Supabase stores the session as `sb-<project-ref>-auth-token` (chunked as `.0`, `.1`, … when large). */
function hasSupabaseAuthCookie(request: NextRequest): boolean {
	return request.cookies
		.getAll()
		.some(({ name }) => name.startsWith("sb-") && /-auth-token(\.\d+)?$/.test(name));
}

function redirectToLogin(request: NextRequest, carryCookiesFrom?: NextResponse): NextResponse {
	const loginUrl = new URL(LOGIN_PATH, request.url);
	loginUrl.searchParams.set("redirectTo", request.nextUrl.pathname);

	const redirect = NextResponse.redirect(loginUrl);
	// Keep any cookie changes Supabase made (e.g. clearing a revoked session).
	carryCookiesFrom?.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
	return redirect;
}

/** Abort after `ms`, still honouring any signal supabase-js passes in (feature-detected per runtime). */
function timeoutSignal(ms: number, parent?: AbortSignal | null): AbortSignal | undefined {
	if (typeof AbortSignal.timeout !== "function") return parent ?? undefined;
	const timeout = AbortSignal.timeout(ms);
	if (!parent) return timeout;
	return typeof AbortSignal.any === "function" ? AbortSignal.any([parent, timeout]) : parent;
}

/** fetch with a hard deadline so no request to Supabase Auth outlives the proxy for long. */
const fetchWithTimeout: typeof fetch = (input, init) =>
	fetch(input, { ...init, signal: timeoutSignal(AUTH_FETCH_TIMEOUT_MS, init?.signal) });

/**
 * Overall deadline for the auth check. Per-fetch timeouts alone are not enough: supabase-js retries
 * a failed token refresh with backoff for up to ~30s.
 */
function withDeadline<T>(promise: Promise<T>, ms: number): Promise<T> {
	let timer: ReturnType<typeof setTimeout> | undefined;
	const deadline = new Promise<never>((_, reject) => {
		timer = setTimeout(() => reject(new Error(`Supabase Auth did not answer within ${ms}ms`)), ms);
	});
	return Promise.race([promise, deadline]).finally(() => clearTimeout(timer));
}

export async function updateSession(request: NextRequest): Promise<NextResponse> {
	const isAdminRoute = isAdminPath(request.nextUrl.pathname);
	const env = getSupabasePublicEnv();

	if (!env) {
		if (!warnedMissingEnv) {
			warnedMissingEnv = true;
			console.warn(
				"[proxy] NEXT_PUBLIC_SUPABASE_URL / publishable key not set: skipping Supabase session refresh (public pages still work, /mgmt-portal redirects to /login)."
			);
		}
		return isAdminRoute ? redirectToLogin(request) : NextResponse.next({ request });
	}

	// No Supabase Auth cookie: an anonymous visitor. Nothing to refresh, nothing to verify.
	if (!hasSupabaseAuthCookie(request)) {
		return isAdminRoute ? redirectToLogin(request) : NextResponse.next({ request });
	}

	let response = NextResponse.next({ request });

	try {
		const supabase = createServerClient(env.url, env.key, {
			cookies: {
				getAll() {
					return request.cookies.getAll();
				},
				setAll(cookiesToSet) {
					cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
					response = NextResponse.next({ request });
					cookiesToSet.forEach(({ name, value, options }) =>
						response.cookies.set(name, value, options)
					);
				},
			},
			global: { fetch: fetchWithTimeout },
		});

		// getUser() asks Supabase Auth to verify the token (refreshing it when expired) — the only
		// check that is safe to trust before letting someone into the admin area.
		const {
			data: { user },
			error,
		} = await withDeadline(supabase.auth.getUser(), AUTH_TIMEOUT_MS);

		if (isAdminRoute && (!user || error)) {
			return redirectToLogin(request, response);
		}
	} catch (error) {
		console.error("[proxy] Supabase session refresh failed", error);
		return isAdminRoute ? redirectToLogin(request) : NextResponse.next({ request });
	}

	return response;
}
