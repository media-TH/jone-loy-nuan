import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/supabase/types";

export const createSupabaseServerClient = async () => {
	const cookieStore = await cookies();
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
	const supabaseKey =
		process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

	return createServerClient<Database>(supabaseUrl, supabaseKey, {
		cookies: {
			get(name: string) {
				return cookieStore.get(name)?.value;
			},
			set(name: string, value: string, options: CookieOptions) {
				try {
					cookieStore.set({ name, value, ...options });
				} catch {
					// noop for server components
				}
			},
			remove(name: string, options: CookieOptions) {
				try {
					cookieStore.set({ name, value: "", ...options });
				} catch {
					// noop for server components
				}
			},
		},
	});
};
