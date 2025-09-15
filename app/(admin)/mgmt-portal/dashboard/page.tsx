import { Suspense } from "react";
import { AdminDashboard } from "@/components/admin-dashboard";

export default function DashboardPage() {
	return (
		<Suspense fallback={<div>Loading dashboard...</div>}>
			<AdminDashboard />
		</Suspense>
	);
}
