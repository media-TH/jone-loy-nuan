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
		const { error } = await supabase.from("quiz_responses").insert([
			{
				session_id: sessionId,
				total_questions: totalQuestions,
				correct_answers: correctAnswers,
				device_type: deviceType,
				user_agent: userAgent,
			},
		]);
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
	device_type?: string;
	user_agent?: string;
}

export async function saveQuizResponse(data: QuizResponseData) {
	try {
		// Validate ข้อมูลเบื้องต้น
		if (
			!data.session_id ||
			typeof data.total_questions !== "number" ||
			typeof data.correct_answers !== "number"
		) {
			throw new Error("ข้อมูลไม่ครบถ้วน");
		}

		const supabase = await createClient();
		const { error } = await supabase.from("quiz_responses").insert([
			{
				session_id: data.session_id,
				total_questions: data.total_questions,
				correct_answers: data.correct_answers,
				device_type: data.device_type || null,
				user_agent: data.user_agent || null,
			},
		]);
		
		if (error) throw error;

		return { success: true, message: "บันทึกผล quiz สำเร็จ!" };
	} catch (error: any) {
		return { success: false, message: error?.message || "เกิดข้อผิดพลาด" };
	}
}
