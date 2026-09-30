/**
 * @jest-environment ./__tests__/security/support/native-fetch-environment.ts
 */
import { getAnalyticsOverview } from "@/lib/actions/analytics";
import { createClient } from "@/utils/supabase/server";
import { GET as getOverview } from "@/app/api/analytics/overview/route";
import { GET as getFromMd } from "@/app/api/analytics/from-md/route";

jest.mock("server-only", () => ({}));
jest.mock("@/utils/supabase/server", () => ({ createClient: jest.fn() }));
jest.mock("@/lib/actions/analytics", () => ({ getAnalyticsOverview: jest.fn() }));

const mockedCreateClient = createClient as jest.MockedFunction<typeof createClient>;
const mockedOverview = getAnalyticsOverview as jest.MockedFunction<typeof getAnalyticsOverview>;

const ENV_KEYS = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY", "ADMIN_EMAILS"] as const;

function sessionUser(user: Record<string, unknown> | null) {
	mockedCreateClient.mockResolvedValue({
		auth: {
			getUser: jest.fn().mockResolvedValue(
				user ? { data: { user }, error: null } : { data: { user: null }, error: { message: "Auth session missing!" } },
			),
		},
	} as unknown as Awaited<ReturnType<typeof createClient>>);
}

describe("analytics API routes require an admin", () => {
	const saved: Partial<Record<(typeof ENV_KEYS)[number], string>> = {};
	let errorSpy: jest.SpyInstance;

	beforeEach(() => {
		for (const key of ENV_KEYS) saved[key] = process.env[key];
		process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abcd.supabase.co";
		process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY = "sb_publishable_test";
		delete process.env.ADMIN_EMAILS;
		mockedCreateClient.mockReset();
		mockedOverview.mockReset();
		errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
	});

	afterEach(() => {
		errorSpy.mockRestore();
		for (const key of ENV_KEYS) {
			if (saved[key] === undefined) delete process.env[key];
			else process.env[key] = saved[key];
		}
	});

	it.each([
		["overview", getOverview],
		["from-md", getFromMd],
	])("%s: 401 JSON without a session, and no data access", async (_name, handler) => {
		sessionUser(null);
		const response = await handler();
		expect(response.status).toBe(401);
		expect(await response.json()).toMatchObject({ error: "unauthenticated" });
		expect(response.headers.get("cache-control")).toContain("no-store");
		expect(mockedOverview).not.toHaveBeenCalled();
	});

	it("403 JSON for a signed-in user outside ADMIN_EMAILS", async () => {
		process.env.ADMIN_EMAILS = "admin@bot.or.th";
		sessionUser({ id: "u1", email: "someone@gmail.com" });
		const response = await getOverview();
		expect(response.status).toBe(403);
		expect(await response.json()).toMatchObject({ error: "forbidden" });
		expect(mockedOverview).not.toHaveBeenCalled();
	});

	it("503 JSON when Supabase is not configured", async () => {
		delete process.env.NEXT_PUBLIC_SUPABASE_URL;
		const response = await getOverview();
		expect(response.status).toBe(503);
		expect(mockedCreateClient).not.toHaveBeenCalled();
	});

	it("serves data to an admin with Cache-Control: no-store", async () => {
		process.env.ADMIN_EMAILS = "Admin@BOT.or.th";
		sessionUser({ id: "u1", email: "admin@bot.or.th" });
		mockedOverview.mockResolvedValue({ ok: 1 } as unknown as Awaited<ReturnType<typeof getAnalyticsOverview>>);

		const response = await getOverview();
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ ok: 1 });
		expect(response.headers.get("cache-control")).toContain("no-store");
	});

	it("hides internal error details from the client", async () => {
		sessionUser({ id: "u1", email: "admin@bot.or.th" });
		mockedOverview.mockRejectedValue(new Error("[quiz_kpi_summary] relation does not exist"));

		const response = await getOverview();
		expect(response.status).toBe(500);
		expect(JSON.stringify(await response.json())).not.toContain("quiz_kpi_summary");
	});
});
