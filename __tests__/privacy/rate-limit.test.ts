import { createRateLimiter } from "@/lib/privacy/rate-limit";

describe("createRateLimiter", () => {
	it("allows `limit` calls per window, then reports when to retry", () => {
		let now = 0;
		const limiter = createRateLimiter({ limit: 2, windowMs: 10_000, now: () => now });

		expect(limiter.check("a")).toEqual({ ok: true });
		now = 1_000;
		expect(limiter.check("a")).toEqual({ ok: true });
		now = 2_000;
		expect(limiter.check("a")).toEqual({ ok: false, retryAfterSeconds: 8 });

		// Other keys are independent.
		expect(limiter.check("b")).toEqual({ ok: true });

		// The first hit leaves the window at 10s.
		now = 10_000;
		expect(limiter.check("a")).toEqual({ ok: true });
	});

	it("forgets the least recently used keys beyond maxKeys", () => {
		let now = 0;
		const limiter = createRateLimiter({ limit: 1, windowMs: 60_000, maxKeys: 2, now: () => now });

		limiter.check("a");
		limiter.check("b");
		limiter.check("c"); // evicts "a"
		now = 1;
		expect(limiter.check("a")).toEqual({ ok: true });
		expect(limiter.check("c").ok).toBe(false);
	});
});
