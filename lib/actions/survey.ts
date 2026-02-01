// lib/actions/survey.ts
"use server";

import { createClient } from "@/utils/supabase/server";
import { surveySchema } from "@/lib/schema";
import { ZodError } from "zod";

export async function submitSurveyAction(prevState: any, formData: FormData) {
	try {
		const rawData = Object.fromEntries(formData.entries());

		// Note: totalScore and totalQuestions are not stored in survey_responses table
		// They are for validation only or could be stored elsewhere if needed
		const totalScore = parseInt(rawData.totalScore as string) || 0;
		const totalQuestions = parseInt(rawData.totalQuestions as string) || 10;

		const surveyData = {
			ageGroup: (rawData.ageGroup as string) || "not_specified",
			education: (rawData.education as string) || "not_specified",
			occupation: (rawData.occupation as string) || "not_specified",
			totalScore,
			totalQuestions,
		};

		// Validate
		surveySchema.parse(surveyData);

		// บันทึกลง Supabase - only fields that exist in the table
		const supabase = await createClient();
		const { error } = await supabase.from("survey_responses").insert([
			{
				age_group: surveyData.ageGroup,
				education: surveyData.education,
				occupation: surveyData.occupation,
				// quiz_session_id can be added later if needed for linking
			},
		]);

		if (error) throw error;

		return { success: true, message: "ขอบคุณสำหรับการให้ข้อมูล! 🎉" };
	} catch (error: any) {
		if (error instanceof ZodError) {
			return {
				success: false,
				message: error.errors.map((e) => e.message).join(", "),
			};
		}
		return { success: false, message: error?.message || "เกิดข้อผิดพลาด" };
	}
}
