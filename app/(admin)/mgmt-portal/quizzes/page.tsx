import { Suspense } from "react";
import AdminContent from "./admin-content";

export default function QuizzesPage() {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<AdminContent />
		</Suspense>
	);
}
