import { createSupabaseServerClient } from "@/lib/supabase/server";

export const quizService = {
	async getPublishedQuizzes() {
		const supabase = await createSupabaseServerClient();
		const { data, error } = await supabase.from("quizzes").select("*").eq("is_active", true);
		if (error) throw error;
		return data;
	},
};
