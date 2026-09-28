// lib/actions/privacy.ts
"use server";

/**
 * PDPA self-service for anonymous players: give or withdraw consent (s.19) and erase everything
 * linked to this browser (s.33).
 *
 * Every action takes the anon JWT of the current tab (getCachedAnonToken() / getAnonToken()),
 * validates its input with zod, lets the database verify who the caller is
 * (lib/privacy/identity.ts), is rate limited per anonymous id, is idempotent (safe to retry) and
 * returns a typed result with a Thai message instead of throwing.
 */

import { z } from "zod";
import { createAdminClient } from "@/utils/supabase/admin";
import { syncConsent } from "@/lib/privacy/consent-log";
import { resolveAnonIdentity } from "@/lib/privacy/identity";
import { POLICY_VERSION, erasableClientKeys, type ConsentPurposeId } from "@/lib/privacy/policy";
import { createRateLimiter } from "@/lib/privacy/rate-limit";
import { anonTokenSchema, consentPurposeSchema, policyVersionSchema } from "@/lib/privacy/schemas";
import type {
	ConsentActionResult,
	EraseMyDataInput,
	EraseMyDataResult,
	ErasureCounts,
	PrivacyErrorCode,
	PrivacyFailure,
	RecordConsentInput,
	WithdrawConsentInput,
} from "@/lib/privacy/types";

const FAILURE_MESSAGES: Record<PrivacyErrorCode, string> = {
	invalid_input: "ข้อมูลที่ส่งมาไม่ถูกต้อง กรุณาโหลดหน้านี้ใหม่แล้วลองอีกครั้ง",
	invalid_identity:
		"ไม่พบรหัสผู้ใช้ที่ยังใช้งานได้ในแท็บนี้ เราจึงยืนยันไม่ได้ว่าข้อมูลใดเป็นของคุณ",
	rate_limited: "คุณทำรายการถี่เกินไป กรุณารอสักครู่แล้วลองอีกครั้ง",
	policy_outdated:
		"ประกาศความเป็นส่วนตัวมีการปรับปรุง กรุณาโหลดหน้าใหม่เพื่ออ่านฉบับล่าสุดก่อนให้ความยินยอม",
	server_error: "ระบบขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้ง",
};

function failure(code: PrivacyErrorCode, retryAfterSeconds?: number): PrivacyFailure {
	return retryAfterSeconds === undefined
		? { ok: false, code, message: FAILURE_MESSAGES[code] }
		: { ok: false, code, message: FAILURE_MESSAGES[code], retryAfterSeconds };
}

// Per anonymous id, per server instance (see lib/privacy/rate-limit.ts).
const consentLimiter = createRateLimiter({ limit: 20, windowMs: 60_000 });
const eraseLimiter = createRateLimiter({ limit: 5, windowMs: 10 * 60_000 });

const recordConsentSchema = z.object({
	token: anonTokenSchema,
	purpose: consentPurposeSchema,
	granted: z.boolean(),
	policyVersion: policyVersionSchema,
});

const withdrawConsentSchema = z.object({
	token: anonTokenSchema,
	purpose: consentPurposeSchema,
});

const eraseMyDataSchema = z.object({
	token: anonTokenSchema.nullish(),
});

/** public.pdpa_erase_subject() result (migration 08). */
const erasureCountsSchema = z
	.object({
		quiz_sessions: z.number().int().nonnegative(),
		question_responses: z.number().int().nonnegative(),
		survey_responses: z.number().int().nonnegative(),
		consent_records: z.number().int().nonnegative(),
	})
	.transform(
		(counts): ErasureCounts => ({
			quizSessions: counts.quiz_sessions,
			questionResponses: counts.question_responses,
			surveyResponses: counts.survey_responses,
			consentRecords: counts.consent_records,
		}),
	);

/**
 * Data held under a consent purpose, deleted when that consent is withdrawn.
 * Service role: anonymous callers cannot delete survey rows themselves (migration 08).
 */
async function eraseDataForPurpose(subjectId: string, purpose: ConsentPurposeId): Promise<number> {
	switch (purpose) {
		case "demographics": {
			const { data, error } = await createAdminClient().rpc("pdpa_erase_demographics", {
				p_anonymous_user_id: subjectId,
			});
			if (error) throw new Error(`pdpa_erase_demographics failed: ${error.code ?? "unknown"}`);
			return typeof data === "number" ? data : 0;
		}
	}
}

async function withdraw(token: string, purpose: ConsentPurposeId): Promise<ConsentActionResult> {
	const resolved = await resolveAnonIdentity(token);
	if (!resolved.ok) return failure(resolved.code);
	const { subjectId, client } = resolved.identity;

	const limit = consentLimiter.check(subjectId);
	if (!limit.ok) return failure("rate_limited", limit.retryAfterSeconds);

	// Log the withdrawal first, then delete. Deleting runs even when the log already said
	// "withdrawn", so a retry after a failed delete still finishes the job.
	const logged = await syncConsent(client, subjectId, purpose, false);
	if (!logged.ok) return failure("server_error");

	const dataErased = await eraseDataForPurpose(subjectId, purpose);

	let message: string;
	if (dataErased > 0) {
		message = `ถอนความยินยอมแล้ว และลบข้อมูลประชากรของคุณ ${dataErased} รายการเรียบร้อย`;
	} else if (logged.changed) {
		message = "ถอนความยินยอมแล้ว เราจะไม่เก็บข้อมูลประชากรของคุณอีก";
	} else {
		message = "ไม่พบความยินยอมที่ต้องถอนในแท็บนี้ และเราไม่ได้เก็บข้อมูลประชากรของคุณไว้";
	}

	return {
		ok: true,
		purpose,
		granted: false,
		policyVersion: POLICY_VERSION,
		changed: logged.changed,
		dataErased,
		message,
	};
}

/**
 * Records the caller's decision for a consent purpose under the current POLICY_VERSION.
 * `granted: false` withdraws (see withdrawConsent). Granting under an outdated notice version is
 * refused with "policy_outdated".
 */
export async function recordConsent(input: RecordConsentInput): Promise<ConsentActionResult> {
	const parsed = recordConsentSchema.safeParse(input);
	if (!parsed.success) return failure("invalid_input");
	const { token, purpose, granted, policyVersion } = parsed.data;

	try {
		if (!granted) return await withdraw(token, purpose);
		if (policyVersion !== POLICY_VERSION) return failure("policy_outdated");

		const resolved = await resolveAnonIdentity(token);
		if (!resolved.ok) return failure(resolved.code);
		const { subjectId, client } = resolved.identity;

		const limit = consentLimiter.check(subjectId);
		if (!limit.ok) return failure("rate_limited", limit.retryAfterSeconds);

		const logged = await syncConsent(client, subjectId, purpose, true);
		if (!logged.ok) return failure("server_error");

		return {
			ok: true,
			purpose,
			granted: true,
			policyVersion: POLICY_VERSION,
			changed: logged.changed,
			dataErased: 0,
			message: "บันทึกความยินยอมแล้ว คุณถอนความยินยอมได้ทุกเมื่อที่หน้าประกาศความเป็นส่วนตัว",
		};
	} catch (error) {
		console.error("[privacy] recordConsent failed", error);
		return failure("server_error");
	}
}

/**
 * Withdraws consent for a purpose (s.19: as easy as giving it) and deletes the data that was held
 * under it: for "demographics", every survey answer linked to the caller's quiz sessions.
 */
export async function withdrawConsent(input: WithdrawConsentInput): Promise<ConsentActionResult> {
	const parsed = withdrawConsentSchema.safeParse(input);
	if (!parsed.success) return failure("invalid_input");

	try {
		return await withdraw(parsed.data.token, parsed.data.purpose);
	} catch (error) {
		console.error("[privacy] withdrawConsent failed", error);
		return failure("server_error");
	}
}

function erasedMessage(counts: ErasureCounts): string {
	const nothingFound =
		counts.quizSessions + counts.questionResponses + counts.surveyResponses + counts.consentRecords ===
		0;
	if (nothingFound) {
		return "ไม่พบข้อมูลบนเซิร์ฟเวอร์ที่เชื่อมกับรหัสในแท็บนี้ และล้างข้อมูลในเบราว์เซอร์นี้แล้ว";
	}
	return `ลบข้อมูลของคุณแล้ว: ผลแบบทดสอบ ${counts.quizSessions} รอบ (${counts.questionResponses} คำตอบ) ข้อมูลประชากร ${counts.surveyResponses} รายการ บันทึกความยินยอม ${counts.consentRecords} รายการ และข้อมูลในเบราว์เซอร์นี้`;
}

const NO_IDENTITY_MESSAGE =
	"ล้างข้อมูลในเบราว์เซอร์นี้แล้ว ไม่พบรหัสผู้ใช้ที่ยังใช้งานได้ในแท็บนี้ จึงไม่มีข้อมูลบนเซิร์ฟเวอร์ที่เชื่อมโยงกลับมาหาคุณได้";

/**
 * Erases everything linked to the caller's anonymous id (quiz sessions, answers, demographics,
 * consent records) via public.pdpa_erase_subject(), and returns the browser keys to clear.
 *
 * Without a usable token (none, expired or rejected) nothing on the server can be linked to this
 * browser any more; the result is still `ok` so the client clears its local copy.
 * The client should only clear local keys after an `ok` result: the token is what proves who
 * the caller is, so it must survive a failed attempt for the retry.
 */
export async function eraseMyData(input: EraseMyDataInput): Promise<EraseMyDataResult> {
	const parsed = eraseMyDataSchema.safeParse(input ?? {});
	if (!parsed.success) return failure("invalid_input");

	const clearLocalKeys = erasableClientKeys();
	const noIdentity: EraseMyDataResult = {
		ok: true,
		code: "no_identity",
		erased: null,
		clearLocalKeys,
		message: NO_IDENTITY_MESSAGE,
	};

	const token = parsed.data.token;
	if (!token) return noIdentity;

	try {
		const resolved = await resolveAnonIdentity(token);
		if (!resolved.ok) return resolved.code === "invalid_identity" ? noIdentity : failure(resolved.code);
		const { subjectId } = resolved.identity;

		const limit = eraseLimiter.check(subjectId);
		if (!limit.ok) return failure("rate_limited", limit.retryAfterSeconds);

		const { data, error } = await createAdminClient().rpc("pdpa_erase_subject", {
			p_anonymous_user_id: subjectId,
		});
		if (error) {
			console.error("[privacy] pdpa_erase_subject failed", { code: error.code });
			return failure("server_error");
		}

		const counts = erasureCountsSchema.safeParse(data);
		if (!counts.success) {
			console.error("[privacy] pdpa_erase_subject returned an unexpected shape");
			return failure("server_error");
		}

		return {
			ok: true,
			code: "erased",
			erased: counts.data,
			clearLocalKeys,
			message: erasedMessage(counts.data),
		};
	} catch (error) {
		console.error("[privacy] eraseMyData failed", error);
		return failure("server_error");
	}
}
