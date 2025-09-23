// lib/actions/quiz.ts
"use server";

import { createClient } from "@/utils/supabase/server";

export async function submitQuizSummaryAction(
	prevState: any,
	formData: FormData
) {
	try {
		const rawData = Object.fromEntries(formData.entries());
		// ดึงข้อมูลจาก formData ตามที่ต้องการ
		const sessionId = rawData.sessionId as string;
		const totalQuestions = parseInt(rawData.totalQuestions as string) || 0;
		const correctAnswers = parseInt(rawData.correctAnswers as string) || 0;
		const deviceType = rawData.deviceType as string;
		const userAgent = rawData.userAgent as string;

		const supabase = await createClient();

		// ใช้ UPSERT แทน INSERT
		const { error } = await supabase
			.from("quiz_sessions")
			.upsert([
				{
					session_id: sessionId,
					total_questions: totalQuestions,
					correct_answers: correctAnswers,
					device_fingerprint: deviceType,
					anonymous_user_id: userAgent,
					completed_at: new Date().toISOString(),
					is_completed: true
				}
			], {
				onConflict: 'session_id'
			});

		if (error) throw error;

		return { success: true, message: "บันทึกผล quiz สำเร็จ!" };
	} catch (error: any) {
		return { success: false, message: error?.message || "เกิดข้อผิดพลาด" };
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
		// Enhanced validation
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

		// Check if session exists first
		const { data: existingSession, error: checkError } = await supabase
			.from("quiz_sessions")
			.select("id, is_completed")
			.eq("session_id", data.session_id)
			.single();

		if (checkError && checkError.code !== 'PGRST116') {
			throw new Error(`Database error: ${checkError.message}`);
		}

		const sessionData = {
			session_id: data.session_id,
			total_questions: data.total_questions,
			correct_answers: data.correct_answers,
			device_fingerprint: data.device_fingerprint || null,
			anonymous_user_id: data.anonymous_user_id || null,
			completed_at: new Date().toISOString(),
			is_completed: true,
			total_summary_score: Math.round((data.correct_answers / data.total_questions) * 100)
		};

		let result;

		if (existingSession) {
			// Update existing session
			result = await supabase
				.from("quiz_sessions")
				.update(sessionData)
				.eq("id", existingSession.id);
		} else {
			// Insert new session
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
	} catch (error: any) {
		console.error('[saveQuizResponse] Error:', error);
		return {
			success: false,
			message: error?.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล"
		};
	}
}
