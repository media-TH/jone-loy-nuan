import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/types";

export const createSupabaseBrowserClient = () => {
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
	const supabaseKey =
		process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

	return createBrowserClient<Database>(supabaseUrl, supabaseKey);
};
