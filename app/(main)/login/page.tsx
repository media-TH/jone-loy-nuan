import { LoginForm } from "@/components/login-form";
import { safeRedirectPath } from "@/lib/security/safe-redirect";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function Page({ 
	searchParams 
}: { 
	searchParams: Promise<{ redirectTo?: string; error?: string }> 
}) {
	const params = await searchParams;
	// Same-site paths only: "?redirectTo=https://evil.example" must never leave the site.
	const redirectTo = safeRedirectPath(params.redirectTo, "/mgmt-portal");

	// ถ้ามี user อยู่แล้วให้เข้า admin หรือหน้าที่ต้องการ
	const supabase = await createClient();
	const { data, error } = await supabase.auth.getUser();

	if (!error && data?.user) {
		redirect(redirectTo);
	}

	return (
		<div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
			<div className="w-full max-w-sm">
				<LoginForm redirectTo={redirectTo} error={params.error} />
			</div>
		</div>
	);
}
