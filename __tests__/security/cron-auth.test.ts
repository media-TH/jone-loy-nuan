import {
	MIN_CRON_SECRET_LENGTH,
	isAuthorizedCronRequest,
	isCronSecretConfigured,
	verifyCronRequest,
} from "@/lib/security/cron-auth";

const SECRET = "c0ffee-keepalive-secret-1234567890";

describe("isAuthorizedCronRequest", () => {
	it("accepts the exact bearer secret", () => {
		expect(isAuthorizedCronRequest(`Bearer ${SECRET}`, SECRET)).toBe(true);
	});

	it("accepts a case-insensitive scheme and surrounding whitespace", () => {
		expect(isAuthorizedCronRequest(`bearer   ${SECRET}  `, SECRET)).toBe(true);
	});

	it("rejects a wrong, truncated or extended secret", () => {
		expect(isAuthorizedCronRequest("Bearer nope", SECRET)).toBe(false);
		expect(isAuthorizedCronRequest(`Bearer ${SECRET.slice(0, -1)}`, SECRET)).toBe(false);
		expect(isAuthorizedCronRequest(`Bearer ${SECRET}x`, SECRET)).toBe(false);
	});

	it("rejects missing headers and other schemes", () => {
		expect(isAuthorizedCronRequest(null, SECRET)).toBe(false);
		expect(isAuthorizedCronRequest(undefined, SECRET)).toBe(false);
		expect(isAuthorizedCronRequest("", SECRET)).toBe(false);
		expect(isAuthorizedCronRequest("Bearer ", SECRET)).toBe(false);
		expect(isAuthorizedCronRequest(SECRET, SECRET)).toBe(false);
		expect(isAuthorizedCronRequest(`Basic ${SECRET}`, SECRET)).toBe(false);
	});

	it("fails closed when the secret is missing or too short", () => {
		expect(isAuthorizedCronRequest("Bearer ", undefined)).toBe(false);
		expect(isAuthorizedCronRequest("Bearer undefined", undefined)).toBe(false);
		expect(isAuthorizedCronRequest("Bearer ", "")).toBe(false);
		expect(isAuthorizedCronRequest("Bearer short", "short")).toBe(false);
	});
});

describe("isCronSecretConfigured", () => {
	it(`requires at least ${MIN_CRON_SECRET_LENGTH} characters`, () => {
		expect(isCronSecretConfigured(undefined)).toBe(false);
		expect(isCronSecretConfigured("x".repeat(MIN_CRON_SECRET_LENGTH - 1))).toBe(false);
		expect(isCronSecretConfigured("x".repeat(MIN_CRON_SECRET_LENGTH))).toBe(true);
	});
});

describe("verifyCronRequest", () => {
	const request = (authorization?: string) =>
		new Request("https://example.test/api/cron/keepalive", {
			headers: authorization ? { Authorization: authorization } : {},
		});

	it("reads the Authorization header from the request", () => {
		expect(verifyCronRequest(request(`Bearer ${SECRET}`), SECRET)).toBe(true);
		expect(verifyCronRequest(request("Bearer wrong"), SECRET)).toBe(false);
		expect(verifyCronRequest(request(), SECRET)).toBe(false);
	});

	it("uses CRON_SECRET from the environment by default", () => {
		const previous = process.env.CRON_SECRET;
		process.env.CRON_SECRET = SECRET;
		try {
			expect(verifyCronRequest(request(`Bearer ${SECRET}`))).toBe(true);
		} finally {
			if (previous === undefined) delete process.env.CRON_SECRET;
			else process.env.CRON_SECRET = previous;
		}
	});
});
