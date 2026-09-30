/**
 * Who counts as an admin — pure rules, shared by API routes (lib/security/require-admin.ts) and
 * anything else that gates the management portal.
 *
 * Baseline (same as app/(admin)/mgmt-portal/layout.tsx): a real Supabase Auth user whose session
 * Supabase has verified via auth.getUser(). Hardening on top:
 *  - Supabase "anonymous sign-in" users are never admins.
 *  - When ADMIN_EMAILS is set (comma-separated), the user's email must be on that list.
 *  - In production the list is required: without it nobody is an admin (fail closed). Supabase
 *    Auth sign-up is open by default, so "has an account" alone is never "admin".
 */

/** The subset of the Supabase `User` the policy needs (keeps this module free of SDK imports). */
export interface AdminCandidate {
	id: string;
	email?: string | null;
	is_anonymous?: boolean;
}

export type AdminDecision =
	| { ok: true }
	| { ok: false; status: 401; code: "unauthenticated" }
	| { ok: false; status: 403; code: "forbidden" };

/** Parse ADMIN_EMAILS ("a@x.th, B@y.th") into a lower-cased set; empty when unset. */
export function parseAdminAllowlist(raw: string | undefined): ReadonlySet<string> {
	if (!raw) return new Set();
	return new Set(
		raw
			.split(/[,\s]+/)
			.map((email) => email.trim().toLowerCase())
			.filter((email) => email.includes("@")),
	);
}

export type AdminPolicyOptions = {
	/** No allowlist = nobody is an admin. On in production (see adminPolicyOptions). */
	requireAllowlist?: boolean;
};

/** The policy for this environment: production requires ADMIN_EMAILS. */
export function adminPolicyOptions(env: Record<string, string | undefined> = process.env): AdminPolicyOptions {
	return { requireAllowlist: env.NODE_ENV === "production" };
}

export function evaluateAdminAccess(
	user: AdminCandidate | null | undefined,
	allowlist: ReadonlySet<string> = new Set(),
	options: AdminPolicyOptions = {},
): AdminDecision {
	if (!user?.id) return { ok: false, status: 401, code: "unauthenticated" };
	if (user.is_anonymous) return { ok: false, status: 403, code: "forbidden" };
	if (options.requireAllowlist && allowlist.size === 0) {
		return { ok: false, status: 403, code: "forbidden" };
	}

	if (allowlist.size > 0) {
		const email = user.email?.trim().toLowerCase();
		if (!email || !allowlist.has(email)) return { ok: false, status: 403, code: "forbidden" };
	}

	return { ok: true };
}
