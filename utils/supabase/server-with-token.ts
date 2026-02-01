/**
 * Supabase server client using anon JWT (จาก issue-anon-jwt).
 * ใช้ใน Server Action เมื่อต้องเขียน quiz_sessions / question_responses ให้ RLS เห็น auth.jwt().
 */

import { createClient } from "@supabase/supabase-js";

export function createServerClientWithToken(token: string) {
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
	const supabaseKey =
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
		process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

	return createClient(supabaseUrl, supabaseKey, {
		global: {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		},
	});
}
