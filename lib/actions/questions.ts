"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import type { Database } from "@/lib/database.types";

// Re-use generated types from database.types.ts
type QuestionRow =
	Database["public"]["Functions"]["get_questions_with_answers"]["Returns"][number];

export interface AdminQuestionDisplay {
	id: string;
	question: string;
	category: string | null;
	answerCount: number;
	orderIndex: number | null;
}

// Transform DB function row -> Admin display
function toAdminDisplay(q: QuestionRow): AdminQuestionDisplay {
	return {
		id: q.id,
		question: q.question_text ?? "",
		category: q.category,
		answerCount: Array.isArray(q.answers) ? q.answers.length : 0,
		orderIndex: q.order_index,
	};
}

export async function fetchQuestions(search: string) {
	const supabase = await createClient();
	const { data, error } = await supabase.rpc("get_questions_with_answers");

	if (error) {
		console.error("Error fetching questions:", error);
		return [];
	}

	const filteredData = search
		? data.filter((q: QuestionRow) =>
			q.question_text?.toLowerCase().includes(search.toLowerCase())
		)
		: data;

	return (filteredData ?? []).map(toAdminDisplay);
}

// NEW: Function to fetch questions for the actual quiz client
export async function fetchQuizQuestions() {
	const supabase = await createClient();
	// Fetch all questions and their answers (ไม่ใช้ .order())
	const { data, error } = await supabase.rpc("get_questions_with_answers");

	if (error) {
		console.error("Error fetching questions for quiz:", error, data);
		return [];
	}

	// Sort ข้อมูลใน JS ตาม order_index
	const sortedData = (data ?? []).sort(
		(a: QuestionRow, b: QuestionRow) =>
			(a.order_index ?? 0) - (b.order_index ?? 0)
	);
	return sortedData;
}

// GET single question by id
export async function fetchQuestionById(id: string) {
	const supabase = await createClient();

	// ใช้ get_questions_with_answers function เพื่อให้ได้ format ข้อมูลที่สม่ำเสมอ
	const { data, error } = await supabase.rpc("get_questions_with_answers");

	if (error) {
		console.error("Error fetching questions:", error);
		return null;
	}

	// หาคำถามที่ต้องการ
	const question = data?.find((q: any) => q.id === id);

	if (!question) {
		console.error("Question not found:", id);
		return null;
	}

	return question;
}

// Enhanced UPSERT question with answers
export async function upsertQuestion(
	previousState: { error: string } | null,
	formData: FormData
) {
	const supabase = await createClient();
	const id = formData.get("id") as string | null;

	try {
		// Parse question data
		const questionData = {
			question_text: formData.get("question_text") as string,
			category: formData.get("category") as string,
			order_index: Number(formData.get("order_index")),
		};

		// Parse answers data (JSON string from form)
		const answersJson = formData.get("answers") as string;
		let answers = [];
		if (answersJson) {
			try {
				answers = JSON.parse(answersJson);
			} catch {
				throw new Error("Invalid answers format");
			}
		}

		// Validate: must have at least 2 answers and at least 1 correct answer
		if (answers.length < 2) {
			throw new Error("คำถามต้องมีอย่างน้อย 2 คำตอบ");
		}

		const correctAnswers = answers.filter((a: any) => a.isCorrect);
		if (correctAnswers.length < 1) {
			throw new Error("คำถามต้องมีคำตอบที่ถูกต้องอย่างน้อย 1 ข้อ");
		}

		let questionId = id;

		if (id) {
			// Update existing question
			const { error } = await supabase
				.from("questions")
				.update(questionData)
				.eq("id", id);
			if (error) throw error;

			// Delete existing answers
			const { error: deleteError } = await supabase
				.from("answers")
				.delete()
				.eq("question_id", id);
			if (deleteError) throw deleteError;
		} else {
			// Create new question
			const { data: newQuestion, error } = await supabase
				.from("questions")
				.insert({
					...questionData,
					content: {},
					result: {},
				})
				.select("id")
				.single();

			if (error) throw error;
			questionId = newQuestion.id;
		}

		// Insert new answers
		if (answers.length > 0 && questionId) {
			const answersData = answers.map((answer: any) => ({
				question_id: questionId,
				answer_text: answer.text,
				is_correct: answer.isCorrect,
			}));

			const { error: answersError } = await supabase
				.from("answers")
				.insert(answersData);

			if (answersError) throw answersError;
		}

		revalidatePath("/mgmt-portal");
		revalidatePath("/mgmt-portal/quizzes");

		// Return success instead of redirecting
		return { success: true };
	} catch (e: unknown) {
		const err = e as Error;
		console.error("Error upserting question:", err);
		return { success: false, error: err.message };
	}
}
// This works as intended because of "ON DELETE CASCADE" in the database.
export async function deleteQuestionAction(
	id: string
): Promise<{ success: boolean; error?: string }> {
	"use server";
	const supabase = await createClient();
	const { error } = await supabase.from("questions").delete().eq("id", id);

	if (error) {
		console.error("Delete error:", error);
		return { success: false, error: error.message };
	}

	revalidatePath("/mgmt-portal");
	revalidatePath("/mgmt-portal/quizzes");
	return { success: true };
}

// =========================
// Quiz Management (Server)
// Ported from scan-dashboard lib/quiz-api.ts to Server Actions style
// =========================

// Minimal Quiz interface for admin usage
export interface Quiz {
	id: string;
	question_text: string;
	kpi_category: string | null;
	category: string | null;
	order_index: number | null;
	created_at: string | null;
	updated_at: string | null;
	content: unknown;
	// Derived/aggregated fields used by UI
	answer_count: number;
	correct_answer_id: string | null;
	image_url: string | null;
	is_active: boolean; // not in DB, default true
	// Raw nested (optional) for detail views
	answers?: Array<{ id: string; answer_text: string; is_correct: boolean }>;
	scenario_images?: Array<{ id: string; image_url: string; alt_text: string | null; display_order: number | null }>;
}

// Server-side data fetching (for server components)
export async function getQuizzesServer(): Promise<Quiz[]> {
	const supabase = await createClient();

	const { data: questions, error } = await supabase
		.from("questions")
		.select(`
      id,
      question_text,
      kpi_category,
      category,
      order_index,
      created_at,
      updated_at,
      content,
      answers (
        id,
        answer_text,
        is_correct
      ),
      scenario_images (
        id,
        image_url,
        alt_text,
        display_order
      )
    `)
		.order("order_index", { ascending: true });

	if (error) {
		console.error("Error fetching quizzes:", error);
		return [];
	}

	const quizzes: Quiz[] =
		(questions ?? []).map((question: any) => ({
			id: question.id,
			question_text: question.question_text,
			kpi_category: question.kpi_category ?? null,
			category: question.category ?? "GENERAL",
			order_index: question.order_index ?? null,
			answer_count: question.answers?.length ?? 0,
			correct_answer_id: question.answers?.find((a: any) => a.is_correct)?.id ?? null,
			image_url: question.scenario_images?.[0]?.image_url ?? "/images/quiz-placeholder.svg",
			is_active: true,
			created_at: question.created_at ?? null,
			updated_at: question.updated_at ?? null,
			content: question.content ?? {},
			answers: question.answers ?? [],
			scenario_images: question.scenario_images ?? [],
		})) || [];

	return quizzes;
}

// Update quiz display order
export async function updateQuizOrderAction(quizzes: Pick<Quiz, "id">[]): Promise<{ success: boolean; error?: string }> {
	const supabase = await createClient();
	try {
		for (const [index, quiz] of quizzes.entries()) {
			const { error } = await supabase
				.from("questions")
				.update({ order_index: index + 1 })
				.eq("id", quiz.id);
			if (error) throw error;
		}

		revalidatePath("/mgmt-portal");
		revalidatePath("/mgmt-portal/quizzes");
		return { success: true };
	} catch (e: unknown) {
		const err = e as Error;
		console.error("Error updating quiz order:", err);
		return { success: false, error: err.message };
	}
}

// Update a quiz/question row
export async function updateQuizAction(quiz: Partial<Quiz> & { id: string }): Promise<{ success: boolean; error?: string }> {
	const supabase = await createClient();
	try {
		const { error } = await supabase
			.from("questions")
			.update({
				question_text: quiz.question_text,
				kpi_category: quiz.kpi_category,
				category: quiz.category,
				order_index: quiz.order_index ?? undefined,
				content: quiz.content,
				updated_at: new Date().toISOString(),
			})
			.eq("id", quiz.id);

		if (error) throw error;

		revalidatePath("/mgmt-portal");
		revalidatePath("/mgmt-portal/quizzes");
		return { success: true };
	} catch (e: unknown) {
		const err = e as Error;
		console.error("Error updating quiz:", err);
		return { success: false, error: err.message };
	}
}

// Create a new quiz/question
export async function createQuizAction(quiz: {
	question_text: string;
	kpi_category: string;
	category: string | null;
	order_index: number | null;
	content?: unknown;
}): Promise<{ success: boolean; id?: string; error?: string }> {
	const supabase = await createClient();
	try {
		const { data, error } = await supabase
			.from("questions")
			.insert({
				question_text: quiz.question_text,
				kpi_category: quiz.kpi_category,
				category: quiz.category,
				order_index: quiz.order_index,
				content: quiz.content ?? {},
			})
			.select("id")
			.single();

		if (error) throw error;

		revalidatePath("/mgmt-portal");
		revalidatePath("/mgmt-portal/quizzes");
		return { success: true, id: data?.id };
	} catch (e: unknown) {
		const err = e as Error;
		console.error("Error creating quiz:", err);
		return { success: false, error: err.message };
	}
}

// =========================
// Answer Management (Server Actions)
// =========================

// Interface for answer management
export interface Answer {
	id: string;
	answer_text: string;
	is_correct: boolean;
}

// Upsert answers for a question (replace all existing answers)
export async function upsertAnswersAction(
	questionId: string,
	answers: Answer[]
): Promise<{ success: boolean; error?: string }> {
	const supabase = await createClient();
	try {
		// Validate: must have at least 2 answers and at least 1 correct answer
		if (answers.length < 2) {
			return { success: false, error: "คำถามต้องมีอย่างน้อย 2 คำตอบ" };
		}

		const correctAnswers = answers.filter(a => a.is_correct);
		if (correctAnswers.length < 1) {
			return { success: false, error: "คำถามต้องมีคำตอบที่ถูกต้องอย่างน้อย 1 ข้อ" };
		}

		// Start transaction-like behavior
		// 1. Delete existing answers for this question
		const { error: deleteError } = await supabase
			.from("answers")
			.delete()
			.eq("question_id", questionId);

		if (deleteError) throw deleteError;

		// 2. Insert new answers
		if (answers.length > 0) {
			const answersData = answers.map(answer => ({
				question_id: questionId,
				answer_text: answer.answer_text,
				is_correct: answer.is_correct,
			}));

			const { error: insertError } = await supabase
				.from("answers")
				.insert(answersData);

			if (insertError) throw insertError;
		}

		revalidatePath("/mgmt-portal");
		revalidatePath("/mgmt-portal/quizzes");
		return { success: true };
	} catch (e: unknown) {
		const err = e as Error;
		console.error("Error upserting answers:", err);
		return { success: false, error: err.message };
	}
}

// Create new answers for a question
export async function createAnswersAction(
	questionId: string,
	answers: Omit<Answer, "id">[]
): Promise<{ success: boolean; error?: string }> {
	const supabase = await createClient();
	try {
		// Validate: must have at least 2 answers and at least 1 correct answer
		if (answers.length < 2) {
			return { success: false, error: "คำถามต้องมีอย่างน้อย 2 คำตอบ" };
		}

		const correctAnswers = answers.filter(a => a.is_correct);
		if (correctAnswers.length < 1) {
			return { success: false, error: "คำถามต้องมีคำตอบที่ถูกต้องอย่างน้อย 1 ข้อ" };
		}

		// Insert new answers
		const answersData = answers.map(answer => ({
			question_id: questionId,
			answer_text: answer.answer_text,
			is_correct: answer.is_correct,
		}));

		const { error } = await supabase
			.from("answers")
			.insert(answersData);

		if (error) throw error;

		revalidatePath("/mgmt-portal");
		revalidatePath("/mgmt-portal/quizzes");
		return { success: true };
	} catch (e: unknown) {
		const err = e as Error;
		console.error("Error creating answers:", err);
		return { success: false, error: err.message };
	}
}

// Update a single answer
export async function updateAnswerAction(
	answerId: string,
	answer: Partial<Answer>
): Promise<{ success: boolean; error?: string }> {
	const supabase = await createClient();
	try {
		const { error } = await supabase
			.from("answers")
			.update({
				answer_text: answer.answer_text,
				is_correct: answer.is_correct,
			})
			.eq("id", answerId);

		if (error) throw error;

		revalidatePath("/mgmt-portal");
		revalidatePath("/mgmt-portal/quizzes");
		return { success: true };
	} catch (e: unknown) {
		const err = e as Error;
		console.error("Error updating answer:", err);
		return { success: false, error: err.message };
	}
}

export async function deleteAnswerAction(
	answerId: string
): Promise<{ success: boolean; error?: string }> {
	const supabase = await createClient();
	try {
		const { error } = await supabase
			.from("answers")
			.delete()
			.eq("id", answerId);

		if (error) throw error;

		revalidatePath("/mgmt-portal");
		revalidatePath("/mgmt-portal/quizzes");
		return { success: true };
	} catch (e: unknown) {
		const err = e as Error;
		console.error("Error deleting answer:", err);
		return { success: false, error: err.message };
	}
}

// Alias: keep compatibility with deleteQuiz naming
export const deleteQuizAction = deleteQuestionAction;

// Update quiz with answers (enhanced version of updateQuizAction)
export async function updateQuizWithAnswersAction(
	quiz: Partial<Quiz> & { id: string },
	answers: Answer[]
): Promise<{ success: boolean; error?: string }> {
	const supabase = await createClient();
	try {
		// Validate answers first
		if (answers.length < 2) {
			return { success: false, error: "คำถามต้องมีอย่างน้อย 2 คำตอบ" };
		}

		const correctAnswers = answers.filter(a => a.is_correct);
		if (correctAnswers.length < 1) {
			return { success: false, error: "คำถามต้องมีคำตอบที่ถูกต้องอย่างน้อย 1 ข้อ" };
		}

		// Update question
		const { error: questionError } = await supabase
			.from("questions")
			.update({
				question_text: quiz.question_text,
				kpi_category: quiz.kpi_category,
				category: quiz.category,
				order_index: quiz.order_index ?? undefined,
				content: quiz.content,
				updated_at: new Date().toISOString(),
			})
			.eq("id", quiz.id);

		if (questionError) throw questionError;

		// Update answers using upsert
		const result = await upsertAnswersAction(quiz.id, answers);
		if (!result.success) {
			return result;
		}

		revalidatePath("/mgmt-portal");
		revalidatePath("/mgmt-portal/quizzes");
		return { success: true };
	} catch (e: unknown) {
		const err = e as Error;
		console.error("Error updating quiz with answers:", err);
		return { success: false, error: err.message };
	}
}
