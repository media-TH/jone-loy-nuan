"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { safeRedirectPath } from "@/lib/security/safe-redirect";
import { createClient } from "@/utils/supabase/server";


export async function login(formData: FormData) {
	const supabase = await createClient();

	// type-casting here for convenience
	// in practice, you should validate your inputs
	const data = {
		email: formData.get("email") as string,
		password: formData.get("password") as string,
	};

	// The hidden field comes from the client: same-site paths only (no open redirect).
	const redirectTo = safeRedirectPath(formData.get("redirectTo"), "/mgmt-portal");

	const { error } = await supabase.auth.signInWithPassword(
		data
	);

	if (error) {
		redirect("/error");
	}

	revalidatePath("/", "layout");
	// Redirect to admin dashboard or the originally requested page
	redirect(redirectTo);
}

export async function logout() {
	const supabase = await createClient();

	const { error } = await supabase.auth.signOut();

	if (error) {
		console.error("Logout error:", error);
	}

	revalidatePath("/", "layout");
	redirect("/");
}
