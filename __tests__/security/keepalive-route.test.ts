/**
 * @jest-environment ./__tests__/security/support/native-fetch-environment.ts
 */
import { createAdminClient } from "@/utils/supabase/admin";
import { GET, dynamic, runtime } from "@/app/api/cron/keepalive/route";

jest.mock("server-only", () => ({}));
jest.mock("@/utils/supabase/admin", () => ({ createAdminClient: jest.fn() }));

const SECRET = "keepalive-test-secret-0123456789";
const mockedCreateAdminClient = createAdminClient as jest.MockedFunction<typeof createAdminClient>;

function call(authorization?: string) {
	return GET(
		new Request("https://example.test/api/cron/keepalive", {
			headers: authorization ? { Authorization: authorization } : {},
		}),
	);
}

function adminClientWithRpc(result: { data: unknown; error: unknown }) {
	const rpc = jest.fn().mockResolvedValue(result);
	mockedCreateAdminClient.mockReturnValue({ rpc } as unknown as ReturnType<typeof createAdminClient>);
	return rpc;
}

describe("GET /api/cron/keepalive", () => {
	const previousSecret = process.env.CRON_SECRET;
	let errorSpy: jest.SpyInstance;

	beforeEach(() => {
		process.env.CRON_SECRET = SECRET;
		mockedCreateAdminClient.mockReset();
		errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
	});

	afterEach(() => {
		errorSpy.mockRestore();
		if (previousSecret === undefined) delete process.env.CRON_SECRET;
		else process.env.CRON_SECRET = previousSecret;
	});

	it("runs on Node and is never cached", () => {
		expect(runtime).toBe("nodejs");
		expect(dynamic).toBe("force-dynamic");
	});

	it("rejects missing or wrong credentials without touching the database", async () => {
		for (const authorization of [undefined, "Bearer wrong-secret-wrong-secret", SECRET]) {
			const response = await call(authorization);
			expect(response.status).toBe(401);
			expect(await response.json()).toEqual({ ok: false, error: "unauthorized" });
			expect(response.headers.get("cache-control")).toContain("no-store");
		}
		expect(mockedCreateAdminClient).not.toHaveBeenCalled();
	});

	it("rejects everything when CRON_SECRET is not configured", async () => {
		delete process.env.CRON_SECRET;
		expect((await call("Bearer ")).status).toBe(401);
		expect((await call("Bearer undefined")).status).toBe(401);
	});

	it("pings the database and returns the ping time", async () => {
		const rpc = adminClientWithRpc({ data: "2026-09-28T03:17:00.123+00:00", error: null });
		const response = await call(`Bearer ${SECRET}`);

		expect(rpc).toHaveBeenCalledWith("keepalive_ping");
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ ok: true, pingedAt: "2026-09-28T03:17:00.123Z" });
		expect(response.headers.get("cache-control")).toContain("no-store");
	});

	it("returns 503 JSON when the database call fails", async () => {
		adminClientWithRpc({ data: null, error: { message: "project paused" } });
		const response = await call(`Bearer ${SECRET}`);
		expect(response.status).toBe(503);
		expect(await response.json()).toEqual({ ok: false, error: "db_unavailable" });
	});

	it("returns 503 JSON when the admin client is not configured", async () => {
		mockedCreateAdminClient.mockImplementation(() => {
			throw new Error("Supabase admin client requires NEXT_PUBLIC_SUPABASE_URL and SECRET_KEY");
		});
		const response = await call(`Bearer ${SECRET}`);
		expect(response.status).toBe(503);
		expect(await response.json()).toEqual({ ok: false, error: "not_configured" });
	});
});
