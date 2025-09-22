import { Suspense } from "react";
import AnalyticsDashboard from "@/components/analytics-dashboard";

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function AnalyticsPage() {
	return (
		<Suspense fallback={<div>Loading analytics...</div>}>
			<AnalyticsDashboard />
		</Suspense>
	);
}
