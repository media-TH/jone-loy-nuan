// lib/actions/survey.ts
"use server";

/**
 * Optional demographic survey after the quiz (useActionState + <form action>).
 *
 * PDPA enforcement happens here, on the server, whatever the page sends:
 * 1. Without the demographics consent flag nothing personal is processed or stored (s.19).
 * 2. Fields are closed option lists: age band (no date of birth), one of the 77 provinces, gender
 *    including "ไม่ระบุ" (lib/privacy/survey.ts). Under 20: the age band only (s.20).
 * 3. The caller's anonymous identity is verified by the database and the quiz session must be
 *    theirs (RLS), so the answers stay linked to them for withdrawal and erasure.
 * 4. The consent is written to pdpa_consent_log with POLICY_VERSION *before* any answer is stored.
 * 5. Only then is the row written, with the service role: since migration 08 the anon and
 *    authenticated roles cannot write survey_responses directly, so this path cannot be skipped.
 *
 * Form fields: see readSurveyForm() in lib/privacy/survey.ts.
 */

import { createAdminClient } from "@/utils/supabase/admin";
import { syncConsent } from "@/lib/privacy/consent-log";
import { resolveAnonIdentity } from "@/lib/privacy/identity";
import { POLICY_VERSION } from "@/lib/privacy/policy";
import { createRateLimiter } from "@/lib/privacy/rate-limit";
import { parseSurveyForm, surveyFieldErrors, toSurveyRow } from "@/lib/privacy/survey";
import type { SurveyActionState } from "@/lib/privacy/types";

const surveyLimiter = createRateLimiter({ limit: 10, windowMs: 10 * 60_000 });

const NO_SESSION: SurveyActionState = {
	success: false,
	stored: false,
	code: "no_session",
	message: "ยังบันทึกข้อมูลไม่ได้ เพราะไม่พบรอบแบบทดสอบของคุณในแท็บนี้ คุณดูผลลัพธ์ต่อได้ตามปกติ",
};

const SERVER_ERROR: SurveyActionState = {
	success: false,
	stored: false,
	code: "server_error",
	message: "ระบบบันทึกข้อมูลไม่สำเร็จชั่วคราว คุณดูผลลัพธ์ต่อได้ตามปกติ หรือลองส่งอีกครั้ง",
};

export async function submitSurveyAction(
	_prevState: unknown,
	formData: FormData,
): Promise<SurveyActionState> {
	const parsed = parseSurveyForm(formData);
	if (!parsed.success) {
		return {
			success: false,
			stored: false,
			code: "invalid_input",
			message: "กรุณาตรวจสอบคำตอบที่ทำเครื่องหมายไว้อีกครั้ง",
			fieldErrors: surveyFieldErrors(parsed.error),
		};
	}

	const submission = parsed.data;

	// No consent: not an error, the player simply continues to their result.
	if (!submission.consent) {
		return {
			success: true,
			stored: false,
			code: "not_stored",
			message: "ไม่ได้เก็บข้อมูลส่วนตัวของคุณ ไปดูผลลัพธ์กันต่อเลย",
		};
	}

	if (submission.policyVersion !== undefined && submission.policyVersion !== POLICY_VERSION) {
		return {
			success: false,
			stored: false,
			code: "policy_outdated",
			message:
				"ประกาศความเป็นส่วนตัวมีการปรับปรุง กรุณาโหลดหน้าใหม่เพื่ออ่านฉบับล่าสุดก่อนให้ความยินยอม",
		};
	}

	const { token, quizSessionId, demographics } = submission;
	if (!token || !quizSessionId) return NO_SESSION;

	try {
		const resolved = await resolveAnonIdentity(token);
		if (!resolved.ok) return resolved.code === "invalid_identity" ? NO_SESSION : SERVER_ERROR;
		const { subjectId, client } = resolved.identity;

		const limit = surveyLimiter.check(subjectId);
		if (!limit.ok) {
			return {
				success: false,
				stored: false,
				code: "rate_limited",
				message: "คุณส่งแบบสอบถามถี่เกินไป กรุณารอสักครู่แล้วลองอีกครั้ง",
				retryAfterSeconds: limit.retryAfterSeconds,
			};
		}

		// RLS on quiz_sessions only returns the caller's own sessions.
		const { data: session, error: sessionError } = await client
			.from("quiz_sessions")
			.select("id")
			.eq("id", quizSessionId)
			.maybeSingle();
		if (sessionError) throw sessionError;
		if (!session) return NO_SESSION;

		// s.19: the consent (and the notice version it was given under) is on record first.
		const consent = await syncConsent(client, subjectId, "demographics", true);
		if (!consent.ok) return SERVER_ERROR;

		const row = toSurveyRow(demographics, {
			quizSessionId,
			policyVersion: POLICY_VERSION,
			submittedAt: new Date().toISOString(),
		});

		// One survey per quiz session: a resubmission replaces the earlier answers.
		const admin = createAdminClient();
		const { data: existing, error: findError } = await admin
			.from("survey_responses")
			.select("id")
			.eq("quiz_session_id", quizSessionId)
			.limit(1)
			.maybeSingle();
		if (findError) throw findError;

		const { error: writeError } = existing
			? await admin.from("survey_responses").update(row).eq("id", existing.id)
			: await admin.from("survey_responses").insert(row);
		if (writeError) throw writeError;

		return {
			success: true,
			stored: true,
			minor: demographics.minor,
			code: "stored",
			message: demographics.minor
				? "บันทึกช่วงอายุของคุณแล้ว ขอบคุณที่ช่วยให้เราวางแผนการสื่อสารได้ดีขึ้น"
				: "บันทึกข้อมูลแล้ว ขอบคุณที่ช่วยให้เราวางแผนการสื่อสารได้ดีขึ้น",
		};
	} catch (error) {
		console.error("[submitSurveyAction] failed", error);
		return SERVER_ERROR;
	}
}
