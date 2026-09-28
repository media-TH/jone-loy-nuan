import { adminPolicyOptions, evaluateAdminAccess, parseAdminAllowlist } from "@/lib/security/admin-policy";

const user = { id: "5b8f0c1e-1111-4a2b-9c3d-000000000001", email: "Admin@BOT.or.th" };

describe("parseAdminAllowlist", () => {
	it("splits on commas and whitespace, lower-cases, and drops junk", () => {
		expect(Array.from(parseAdminAllowlist(" Admin@BOT.or.th, ops@thaimediafund.or.th  x "))).toEqual([
			"admin@bot.or.th",
			"ops@thaimediafund.or.th",
		]);
	});

	it("is empty when unset", () => {
		expect(parseAdminAllowlist(undefined).size).toBe(0);
		expect(parseAdminAllowlist("").size).toBe(0);
	});
});

describe("evaluateAdminAccess", () => {
	it("returns 401 without a verified user", () => {
		expect(evaluateAdminAccess(null)).toEqual({ ok: false, status: 401, code: "unauthenticated" });
		expect(evaluateAdminAccess(undefined)).toEqual({ ok: false, status: 401, code: "unauthenticated" });
	});

	it("allows any signed-in user when no allowlist is configured (portal baseline)", () => {
		expect(evaluateAdminAccess(user)).toEqual({ ok: true });
	});

	it("never treats Supabase anonymous sign-ins as admins", () => {
		expect(evaluateAdminAccess({ ...user, is_anonymous: true })).toEqual({
			ok: false,
			status: 403,
			code: "forbidden",
		});
	});

	it("enforces the allowlist case-insensitively when configured", () => {
		const allowlist = parseAdminAllowlist("admin@bot.or.th");
		expect(evaluateAdminAccess(user, allowlist)).toEqual({ ok: true });
		expect(evaluateAdminAccess({ ...user, email: "someone@gmail.com" }, allowlist)).toEqual({
			ok: false,
			status: 403,
			code: "forbidden",
		});
		expect(evaluateAdminAccess({ ...user, email: null }, allowlist)).toEqual({
			ok: false,
			status: 403,
			code: "forbidden",
		});
	});

	it("fails closed when the allowlist is required but empty (production)", () => {
		const required = { requireAllowlist: true };
		expect(evaluateAdminAccess(user, new Set(), required)).toEqual({
			ok: false,
			status: 403,
			code: "forbidden",
		});
		expect(evaluateAdminAccess(user, parseAdminAllowlist("admin@bot.or.th"), required)).toEqual({ ok: true });
	});
});

describe("adminPolicyOptions", () => {
	it("requires ADMIN_EMAILS in production only", () => {
		expect(adminPolicyOptions({ NODE_ENV: "production" })).toEqual({ requireAllowlist: true });
		expect(adminPolicyOptions({ NODE_ENV: "development" })).toEqual({ requireAllowlist: false });
		expect(adminPolicyOptions({ NODE_ENV: "test" })).toEqual({ requireAllowlist: false });
	});
});
