"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import type { Database } from "@/lib/database.types";
import { redirect } from "next/navigation";

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

	console.log("[fetchQuestionById] Total questions found:", data?.length || 0);

	// หาคำถามที่ต้องการ
	const question = data?.find((q: any) => q.id === id);

	if (!question) {
		console.error("[fetchQuestionById] Question not found:", id);
		console.log("[fetchQuestionById] Available question IDs:", data?.map((q: any) => q.id) || []);
		return null;
	}

	console.log("[fetchQuestionById] Question found:", question.question_text?.substring(0, 50) + "...");
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

		revalidatePath("/(admin)");
		revalidatePath("/(admin)/quizzes");

		// Return success instead of redirecting
		return { success: true };
	} catch (e: unknown) {
		const error = e as Error;
		return { error: error.message };
	}
}

// DELETE question by id (new standalone action)
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

	revalidatePath("/(admin)");
	revalidatePath("/(admin)/quizzes");
	return { success: true };
}
