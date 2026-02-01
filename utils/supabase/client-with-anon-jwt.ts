/**
 * Supabase browser client using anon JWT from Edge Function (issue-anon-jwt).
 * Use for quiz flow so RLS / Auth sees the anon user identity.
 */

import { createBrowserClient } from "@supabase/ssr";

export function createClientWithAnonJwt(token: string) {
	const isDev = process.env.NODE_ENV === "development";
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
	const supabaseKey =
		(isDev
			? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
			: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ??
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
		process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

	return createBrowserClient(supabaseUrl, supabaseKey, {
		global: {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		},
	});
}
