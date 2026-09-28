/**
 * Authorisation for scheduled jobs (Vercel Cron, GitHub Actions backup).
 *
 * Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` automatically once the CRON_SECRET env var
 * is set on the project. Comparison is constant-time: both sides are hashed to a fixed-length digest
 * first, so neither the content nor the length of the secret leaks through timing.
 */

import { createHash, timingSafeEqual } from "node:crypto";

/** Shorter secrets are treated as "not configured" so a placeholder can never open the route. */
export const MIN_CRON_SECRET_LENGTH = 16;

const BEARER_PREFIX = /^Bearer\s+/i;

function digest(value: string): Buffer {
	return createHash("sha256").update(value, "utf8").digest();
}

export function isCronSecretConfigured(secret: string | undefined): secret is string {
	return typeof secret === "string" && secret.trim().length >= MIN_CRON_SECRET_LENGTH;
}

/**
 * True only when `secret` is configured and the header is exactly `Bearer <secret>`.
 * Fails closed: a missing or too-short secret rejects every request.
 */
export function isAuthorizedCronRequest(
	authorizationHeader: string | null | undefined,
	secret: string | undefined,
): boolean {
	if (!isCronSecretConfigured(secret)) return false;
	if (!authorizationHeader || !BEARER_PREFIX.test(authorizationHeader)) return false;

	const presented = authorizationHeader.replace(BEARER_PREFIX, "").trim();
	if (!presented) return false;

	return timingSafeEqual(digest(presented), digest(secret.trim()));
}

/** Convenience wrapper for route handlers: reads the header and CRON_SECRET from the environment. */
export function verifyCronRequest(request: Request, secret = process.env.CRON_SECRET): boolean {
	return isAuthorizedCronRequest(request.headers.get("authorization"), secret);
}
