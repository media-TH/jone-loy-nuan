/**
 * Open-redirect guard for "redirectTo" style parameters (e.g. the login form's hidden field).
 * Only same-site absolute paths are allowed: "/mgmt-portal/quiz" passes, while
 * "https://evil.example", "//evil.example", "/\\evil.example" and "javascript:..." fall back.
 */

const SAFE_BASE = "https://redirect.invalid";

export function safeRedirectPath(value: unknown, fallback = "/"): string {
	if (typeof value !== "string") return fallback;
	const candidate = value.trim();

	// Must be a rooted path, and not protocol-relative ("//host") or backslash-smuggled ("/\host").
	if (!candidate.startsWith("/") || candidate.startsWith("//") || candidate.startsWith("/\\")) {
		return fallback;
	}
	// Control characters (tab/newline) are stripped by URL parsers and can turn "/\t/host" into "//host".
	if (/[\u0000-\u001f\u007f]/.test(candidate)) return fallback;

	try {
		const url = new URL(candidate, SAFE_BASE);
		if (url.origin !== SAFE_BASE) return fallback;
		return `${url.pathname}${url.search}${url.hash}`;
	} catch {
		return fallback;
	}
}
