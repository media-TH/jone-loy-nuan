import { createClient } from "@/utils/supabase/server";

export async function debugSession() {
    const supabase = await createClient();

    try {
        console.log("=== DEBUG SESSION START ===");

        // Check session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        console.log("Session:", {
            hasSession: !!session,
            sessionError,
            expiresAt: session?.expires_at,
            accessToken: session?.access_token ? "present" : "missing"
        });

        // Check user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        console.log("User:", {
            hasUser: !!user,
            userError,
            email: user?.email,
            id: user?.id
        });

        console.log("=== DEBUG SESSION END ===");

        return { session, user, sessionError, userError };
    } catch (error) {
        console.error("Debug session error:", error);
        return { session: null, user: null, sessionError: error, userError: error };
    }
}