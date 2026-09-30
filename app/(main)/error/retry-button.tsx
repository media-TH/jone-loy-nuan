"use client";

import { useRouter } from "next/navigation";
import { IconRefresh } from "@tabler/icons-react";
import { Button } from "@/components/ds/button";

/**
 * "ลองอีกครั้ง": back to the page that failed (e.g. the sign-in form), where the action can be
 * repeated. Opened directly with no history, it reloads the app from the landing page instead.
 */
export function RetryButton() {
	const router = useRouter();

	const handleRetry = () => {
		if (window.history.length > 1) router.back();
		else router.replace("/");
	};

	return (
		<Button type="button" variant="spark" size="lg" block onClick={handleRetry}>
			<IconRefresh aria-hidden stroke={2.25} />
			ลองอีกครั้ง
		</Button>
	);
}
