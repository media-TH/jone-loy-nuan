import { createBrowserClient } from "@supabase/ssr";

export const createClient = () => {
	const isDev = process.env.NODE_ENV === "development";
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
	const supabaseKey =
		(isDev
			? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
			: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ??
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
		process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

	return createBrowserClient(supabaseUrl, supabaseKey);
};
