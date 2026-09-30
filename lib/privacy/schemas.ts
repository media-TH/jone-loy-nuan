/**
 * zod building blocks shared by the privacy Server Actions (lib/actions/privacy.ts) and the survey
 * (lib/privacy/survey.ts). Validation only: identity is verified by the database, never here.
 */

import { z } from "zod";
import { CONSENT_PURPOSE_IDS } from "@/lib/privacy/policy";

/** Three base64url segments. A cheap shape check before the token is sent to Supabase. */
const JWT_SHAPE = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

/** The anon JWT issued by the issue-anon-jwt Edge Function (lib/services/anon-jwt.service.ts). */
export const anonTokenSchema = z
	.string()
	.trim()
	.min(16, "โทเค็นไม่ถูกต้อง")
	.max(4096, "โทเค็นไม่ถูกต้อง")
	.regex(JWT_SHAPE, "โทเค็นไม่ถูกต้อง");

export const consentPurposeSchema = z.enum(CONSENT_PURPOSE_IDS);

/** POLICY_VERSION format (ISO date). Whether it is the current version is checked separately. */
export const policyVersionSchema = z
	.string()
	.trim()
	.regex(/^\d{4}-\d{2}-\d{2}$/, "รูปแบบฉบับของประกาศไม่ถูกต้อง");

/** quiz_sessions.id (the store's databaseSessionId), not the public `quiz_…` session string. */
export const quizSessionIdSchema = z.string().trim().uuid("รหัสรอบแบบทดสอบไม่ถูกต้อง");

/** "" / null / the legacy "not_specified" placeholder all mean "not answered". */
export function blankToUndefined(value: unknown): unknown {
	if (value === null || value === undefined) return undefined;
	if (typeof value !== "string") return value;
	const trimmed = value.trim();
	return trimmed === "" || trimmed === "not_specified" ? undefined : trimmed;
}

/** "granted" = ConsentPanel's switch value; "on" = a native checkbox without a value attribute. */
const GRANTED_VALUES: ReadonlySet<string> = new Set(["granted", "true", "on"]);

/**
 * A consent flag is true only for an explicit opt-in value or `true`. Anything else, including a
 * missing field, is "not granted": consent is never inferred.
 */
export function isGrantedFlag(value: unknown): boolean {
	if (value === true) return true;
	return typeof value === "string" && GRANTED_VALUES.has(value.trim().toLowerCase());
}
