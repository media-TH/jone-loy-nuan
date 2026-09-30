/**
 * Small sliding-window rate limiter for the privacy Server Actions.
 *
 * In-memory and per server instance, so on serverless it is best-effort: it stops a single client
 * from hammering one instance, while the actions stay idempotent for anything that gets through.
 */

export type RateLimitDecision = { ok: true } | { ok: false; retryAfterSeconds: number };

export type RateLimiter = {
	check: (key: string) => RateLimitDecision;
};

type RateLimiterOptions = {
	/** Calls allowed per key within `windowMs`. */
	limit: number;
	windowMs: number;
	/** Keys tracked at most; the least recently used key is forgotten first. */
	maxKeys?: number;
	now?: () => number;
};

export function createRateLimiter({
	limit,
	windowMs,
	maxKeys = 5_000,
	now = Date.now,
}: RateLimiterOptions): RateLimiter {
	const hits = new Map<string, number[]>();

	return {
		check(key) {
			const time = now();
			const recent = (hits.get(key) ?? []).filter((at) => time - at < windowMs);

			if (recent.length >= limit) {
				hits.set(key, recent);
				const retryAfterMs = windowMs - (time - recent[0]);
				return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)) };
			}

			recent.push(time);
			// Re-insert so Map order tracks recency, then evict the stalest keys beyond the cap.
			hits.delete(key);
			hits.set(key, recent);
			while (hits.size > maxKeys) {
				const oldest = hits.keys().next().value;
				if (oldest === undefined) break;
				hits.delete(oldest);
			}

			return { ok: true };
		},
	};
}
