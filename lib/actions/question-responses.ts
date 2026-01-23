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
	kpi_category: string;
	question_order: number;
	device_type?: string;
	user_agent?: string;
}

/**
 * 📝 Save individual question response with enhanced validation
 * Records each question response to question_responses table
 */
export async function saveQuestionResponse(data: QuestionResponseData) {
	try {
		// Enhanced validation
		if (!data.quiz_session_id?.trim()) {
			throw new Error("Quiz session ID is required");
		}

		if (!data.question_id?.trim()) {
			throw new Error("Question ID is required");
		}

		if (!data.kpi_category?.trim()) {
			throw new Error("KPI category is required");
		}

		if (typeof data.response_time_ms !== 'number' || data.response_time_ms < 0) {
			throw new Error("Response time must be a non-negative number");
		}

		if (typeof data.question_order !== 'number' || data.question_order < 1) {
			throw new Error("Question order must be a positive number");
		}

		const supabase = await createClient();

		// Check if response already exists (prevent duplicates)
		const { data: existingResponse } = await supabase
			.from("question_responses")
			.select("id")
			.eq("quiz_session_id", data.quiz_session_id)
			.eq("question_id", data.question_id)
			.single();

		if (existingResponse) {
			return {
				success: true,
				message: "คำตอบนี้ถูกบันทึกไว้แล้ว",
				action: 'skipped'
			};
		}

		const { error } = await supabase.from("question_responses").insert([
			{
				quiz_session_id: data.quiz_session_id,
				question_id: data.question_id,
				selected_answer_id: data.selected_answer_id,
				is_correct: data.is_correct,
				response_time_ms: data.response_time_ms,
				kpi_category: data.kpi_category,
				question_order: data.question_order,
				answered_at: new Date().toISOString()
			},
		]);

		if (error) throw error;

		return {
			success: true,
			message: "บันทึกคำตอบสำเร็จ!",
			action: 'created'
		};
	} catch (error: any) {
		console.error('[saveQuestionResponse] Error:', error);
		return {
			success: false,
			message: error?.message || "เกิดข้อผิดพลาดในการบันทึกคำตอบ"
		};
	}
}

/**
 * 📦 Batch save multiple question responses
 * More efficient for saving multiple responses at once
 */
export async function saveQuestionResponsesBatch(responses: QuestionResponseData[]) {
	try {
		if (!responses || responses.length === 0) {
			throw new Error("No responses to save");
		}

		// Validate all responses
		for (const [index, response] of responses.entries()) {
			if (!response.quiz_session_id?.trim()) {
				throw new Error(`Response ${index + 1}: Quiz session ID is required`);
			}
			if (!response.question_id?.trim()) {
				throw new Error(`Response ${index + 1}: Question ID is required`);
			}
			if (!response.kpi_category?.trim()) {
				throw new Error(`Response ${index + 1}: KPI category is required`);
			}
		}

		const supabase = await createClient();

		// Prepare data for batch insert
		const responseData = responses.map(response => ({
			quiz_session_id: response.quiz_session_id,
			question_id: response.question_id,
			selected_answer_id: response.selected_answer_id,
			is_correct: response.is_correct,
			response_time_ms: response.response_time_ms,
			kpi_category: response.kpi_category,
			question_order: response.question_order,
			answered_at: new Date().toISOString()
		}));

		const { error } = await supabase
			.from("question_responses")
			.insert(responseData);

		if (error) throw error;

		return {
			success: true,
			message: `บันทึกคำตอบ ${responses.length} ข้อสำเร็จ!`,
			count: responses.length
		};
	} catch (error: any) {
		console.error('[saveQuestionResponsesBatch] Error:', error);
		return {
			success: false,
			message: error?.message || "เกิดข้อผิดพลาดในการบันทึกคำตอบ"
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

