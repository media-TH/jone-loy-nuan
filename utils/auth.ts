import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export async function requireAuth() {
    const supabase = await createClient();

    try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (!session || !user || sessionError || userError) {
            console.log("Auth required but no valid session found");
            redirect("/login");
        }

        return { user, session };
    } catch (error) {
        console.error("Auth check error:", error);
        redirect("/login");
    }
}

export async function getAuthUser() {
    const supabase = await createClient();

    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        return { user, error };
    } catch (error) {
        console.error("Get auth user error:", error);
        return { user: null, error };
    }
}