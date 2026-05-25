import "server-only";

const windowMs = 60_000;
const maxRequests = 60;
const bucket = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string) {
  const now = Date.now();
  const state = bucket.get(key);

  if (!state || now > state.resetAt) {
    bucket.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs };
  }

  if (state.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: state.resetAt };
  }

  state.count += 1;
  return { allowed: true, remaining: maxRequests - state.count, resetAt: state.resetAt };
}
