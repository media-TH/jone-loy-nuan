// lib/actions/question-responses.ts
"use server";

import { createClient } from "@/utils/supabase/server";

// --- Enhanced Server Actions for Individual Response Tracking ---

interface QuestionResponseData {
	quiz_session_id: string;
	question_id: string;
	selected_answer_id: string | null;
	is_correct: boolean;
	response_time_ms: number;
	kpi_category_id: string;
	question_order: number;
	device_type?: string;
	user_agent?: string;
}

/**
 * 📝 Save individual question response
 * Records each question response to question_responses table
 */
export async function saveQuestionResponse(data: QuestionResponseData) {
	try {
		// Validate required fields
		if (!data.quiz_session_id || !data.question_id || !data.kpi_category_id) {
			throw new Error("ข้อมูลไม่ครบถ้วน: ต้องมี quiz_session_id, question_id, และ kpi_category_id");
		}

		const supabase = await createClient();
		const { error } = await supabase.from("question_responses").insert([
			{
				quiz_session_id: data.quiz_session_id,
				question_id: data.question_id,
				selected_answer_id: data.selected_answer_id,
				is_correct: data.is_correct,
				response_time_ms: data.response_time_ms,
				kpi_category_id: data.kpi_category_id,
				question_order: data.question_order,
				device_type: data.device_type || null,
				user_agent: data.user_agent || null,
			},
		]);

		if (error) throw error;

		return { success: true, message: "บันทึกคำตอบสำเร็จ!" };
	} catch (error: any) {
		return { success: false, message: error?.message || "เกิดข้อผิดพลาดในการบันทึกคำตอบ" };
	}
}

/**
 * 📊 Save multiple question responses in batch
 * Efficient batch insertion for multiple responses
 */
export async function saveQuestionResponsesBatch(responses: QuestionResponseData[]) {
	try {
		if (!responses || responses.length === 0) {
			throw new Error("ไม่มีข้อมูลคำตอบที่จะบันทึก");
		}

		// Validate all responses
		for (const response of responses) {
			if (!response.quiz_session_id || !response.question_id || !response.kpi_category_id) {
				throw new Error("ข้อมูลไม่ครบถ้วนในบางคำตอบ");
			}
		}

		const supabase = await createClient();

		// Prepare data for batch insert
		const batchData = responses.map(data => ({
			quiz_session_id: data.quiz_session_id,
			question_id: data.question_id,
			selected_answer_id: data.selected_answer_id,
			is_correct: data.is_correct,
			response_time_ms: data.response_time_ms,
			kpi_category_id: data.kpi_category_id,
			question_order: data.question_order,
			device_type: data.device_type || null,
			user_agent: data.user_agent || null,
		}));

		const { error } = await supabase.from("question_responses").insert(batchData);

		if (error) throw error;

		return {
			success: true,
			message: `บันทึกคำตอบทั้งหมด ${responses.length} ข้อสำเร็จ!`,
			count: responses.length
		};
	} catch (error: any) {
		return {
			success: false,
			message: error?.message || "เกิดข้อผิดพลาดในการบันทึกคำตอบแบบกลุ่ม"
		};
	}
}

/**
 * 🔍 Get question responses for a quiz session
 * Retrieve all responses for analysis
 */
export async function getQuestionResponses(quizSessionId: string) {
	try {
		if (!quizSessionId) {
			throw new Error("ต้องระบุ quiz session ID");
		}

		const supabase = await createClient();
		const { data, error } = await supabase
			.from("question_responses")
			.select(`
				*,
				questions!inner(question_text, content),
				kpi_categories!inner(slug, display_name)
			`)
			.eq("quiz_session_id", quizSessionId)
			.order("question_order", { ascending: true });

		if (error) throw error;

		return {
			success: true,
			data: data || [],
			message: "ดึงข้อมูลคำตอบสำเร็จ!"
		};
	} catch (error: any) {
		return {
			success: false,
			message: error?.message || "เกิดข้อผิดพลาดในการดึงข้อมูลคำตอบ",
			data: []
		};
	}
}

/**
 * 📈 Get KPI summary for a quiz session
 * Calculate real-time KPI scores
 */
export async function getQuizKPISummary(quizSessionId: string) {
	try {
		if (!quizSessionId) {
			throw new Error("ต้องระบุ quiz session ID");
		}

		const supabase = await createClient();
		const { data, error } = await supabase
			.from("quiz_kpi_summary")
			.select("*")
			.eq("quiz_session_id", quizSessionId)
			.single();

		if (error) {
			if (error.code === 'PGRST116') {
				return {
					success: false,
					message: "ไม่พบข้อมูล KPI สำหรับเซสชันนี้",
					data: null
				};
			}
			throw error;
		}

		return {
			success: true,
			data: data,
			message: "ดึงข้อมูล KPI สำเร็จ!"
		};
	} catch (error: any) {
		return {
			success: false,
			message: error?.message || "เกิดข้อผิดพลาดในการดึงข้อมูล KPI",
			data: null
		};
	}
}

/**
 * 🎯 Update quiz session progress in real-time
 * Called after each question response to keep session data current
 */
export async function updateQuizSessionProgress(
	sessionId: string,
	completedQuestions: number,
	correctAnswers: number
) {
	try {
		if (!sessionId) {
			throw new Error("ต้องระบุ session ID");
		}

		const supabase = await createClient();
		const { error } = await supabase
			.from("quiz_sessions")
			.update({
				completed_questions: completedQuestions,
				correct_answers: correctAnswers
			})
			.eq("session_id", sessionId);

		if (error) throw error;

		return {
			success: true,
			message: "อัพเดตความคืบหน้าสำเร็จ!"
		};
	} catch (error: any) {
		return {
			success: false,
			message: error?.message || "เกิดข้อผิดพลาดในการอัพเดตความคืบหน้า"
		};
	}
}

// Export type for use in other files
export type { QuestionResponseData };