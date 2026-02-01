// lib/actions/quiz.ts
"use server";

import { createClient } from "@/utils/supabase/server";

export async function submitQuizSummaryAction(
	prevState: unknown,
	formData: FormData
) {
	try {
		const rawData = Object.fromEntries(formData.entries());
		const sessionId = rawData.sessionId as string;
		const totalQuestions = parseInt(rawData.totalQuestions as string) || 0;
		const correctAnswers = parseInt(rawData.correctAnswers as string) || 0;
		const deviceType = rawData.deviceType as string;
		const anonymousUserId = rawData.anonymousUserId as string;

		const supabase = await createClient();

		// Guard-prefix anonymous_user_id
		const ensuredAnonymousId = anonymousUserId && anonymousUserId.trim()
			? (anonymousUserId.startsWith('user_') ? anonymousUserId : `user_${anonymousUserId}`)
			: null;

		const { error } = await supabase
			.from("quiz_sessions")
			.upsert([
				{
					session_id: sessionId,
					total_questions: totalQuestions,
					correct_answers: correctAnswers,
					device_fingerprint: deviceType,
					anonymous_user_id: ensuredAnonymousId,
					completed_at: new Date().toISOString(),
					is_completed: true
				}
			], {
				onConflict: 'session_id'
			});

		if (error) throw error;

		return { success: true, message: "บันทึกผล quiz สำเร็จ!" };
	} catch (error: unknown) {
		const err = error as Error;
		return { success: false, message: err?.message || "เกิดข้อผิดพลาด" };
	}
}

interface QuizResponseData {
	session_id: string;
	total_questions: number;
	correct_answers: number;
	device_fingerprint?: string;
	anonymous_user_id?: string;
}

export async function saveQuizResponse(data: QuizResponseData) {
	try {
		if (!data.session_id?.trim()) {
			throw new Error("Session ID is required");
		}

		if (typeof data.total_questions !== "number" || data.total_questions <= 0) {
			throw new Error("Total questions must be a positive number");
		}

		if (typeof data.correct_answers !== "number" || data.correct_answers < 0) {
			throw new Error("Correct answers must be a non-negative number");
		}

		if (data.correct_answers > data.total_questions) {
			throw new Error("Correct answers cannot exceed total questions");
		}

		const supabase = await createClient();

		const { data: existingSession, error: checkError } = await supabase
			.from("quiz_sessions")
			.select("id, is_completed")
			.eq("session_id", data.session_id)
			.single();

		if (checkError && checkError.code !== 'PGRST116') {
			throw new Error(`Database error: ${checkError.message}`);
		}

		// Guard-prefix anonymous_user_id
		const ensuredAnonymousId = data.anonymous_user_id?.trim()
			? (data.anonymous_user_id.startsWith('user_') ? data.anonymous_user_id : `user_${data.anonymous_user_id}`)
			: null;

		const sessionData = {
			session_id: data.session_id,
			total_questions: data.total_questions,
			correct_answers: data.correct_answers,
			device_fingerprint: data.device_fingerprint || null,
			anonymous_user_id: ensuredAnonymousId,
			completed_at: new Date().toISOString(),
			is_completed: true,
			total_summary_score: Math.round((data.correct_answers / data.total_questions) * 100)
		};

		let result;

		if (existingSession) {
			result = await supabase
				.from("quiz_sessions")
				.update(sessionData)
				.eq("id", existingSession.id);
		} else {
			result = await supabase
				.from("quiz_sessions")
				.insert([sessionData]);
		}

		if (result.error) throw result.error;

		return {
			success: true,
			message: "บันทึกผล quiz สำเร็จ!",
			action: existingSession ? 'updated' : 'created'
		};
	} catch (error: unknown) {
		const err = error as Error;
		console.error('[saveQuizResponse] Error:', err);
		return {
			success: false,
			message: err?.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล"
		};
	}
}