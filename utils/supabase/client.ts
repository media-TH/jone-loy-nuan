import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/types";

export const createClient = () => {
	const isDev = process.env.NODE_ENV === "development";
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
	const supabaseKey =
		(isDev
			? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
			: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ??
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
		process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

	return createBrowserClient<Database>(supabaseUrl, supabaseKey);
};
