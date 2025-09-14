"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";


export async function login(formData: FormData) {
	const supabase = await createClient();

	// type-casting here for convenience
	// in practice, you should validate your inputs
	const data = {
		email: formData.get("email") as string,
		password: formData.get("password") as string,
	};

	const redirectTo = formData.get("redirectTo") as string;

	const { error, data: authData } = await supabase.auth.signInWithPassword(
		data
	);

	if (error) {
		console.error("Login error:", error);
		// Redirect back to login with error
		const loginUrl = new URL('/login', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');
		if (redirectTo) {
			loginUrl.searchParams.set('redirectTo', redirectTo);
		}
		loginUrl.searchParams.set('error', 'auth_failed');
		redirect(loginUrl.toString());
	}

	// Ensure session is properly established
	if (authData.session) {
		// Force revalidation of all cached data
		revalidatePath("/", "layout");

		// Small delay to ensure session is fully established
		await new Promise(resolve => setTimeout(resolve, 100));

		// Redirect to admin dashboard or the originally requested page
		// Convert admin paths to hidden paths
		const finalRedirect = redirectTo?.startsWith('/(admin)')
			? redirectTo.replace('/(admin)', '/x9k2m7n4p8q1')
			: redirectTo || "/x9k2m7n4p8q1";
		redirect(finalRedirect);
	} else {
		// No session created, redirect back to login with error
		const loginUrl = new URL('/login', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');
		if (redirectTo) {
			loginUrl.searchParams.set('redirectTo', redirectTo);
		}
		loginUrl.searchParams.set('error', 'auth_failed');
		redirect(loginUrl.toString());
	}
}

export async function logout() {
	const supabase = await createClient();

	const { error } = await supabase.auth.signOut();

	if (error) {
		console.error("Logout error:", error);
	}

	// Clear all cached data and force revalidation
	revalidatePath("/", "layout");

	// Small delay to ensure logout is processed
	await new Promise(resolve => setTimeout(resolve, 100));

	redirect("/");
}

export async function signup(formData: FormData) {
	const supabase = await createClient();

	// type-casting here for convenience
	// in practice, you should validate your inputs
	const data = {
		email: formData.get("email") as string,
		password: formData.get("password") as string,
	};

	const { error } = await supabase.auth.signUp(data);

	if (error) {
		redirect("/error");
	}

	revalidatePath("/", "layout");
	redirect("/");
}
