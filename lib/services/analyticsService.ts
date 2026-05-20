import { createSupabaseServerClient } from "@/lib/supabase/server";

export const analyticsService = {
	async getOverviewMetrics() {
		const supabase = await createSupabaseServerClient();
		const { data, error } = await supabase.rpc("get_dashboard_metrics");
		if (error) throw error;
		return data;
	},
};
