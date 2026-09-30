"use client";

import { IconHome, IconRefresh } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { startTransition, useEffect } from "react";
import { Button } from "@/components/ds/button";
import { TransitionLink } from "@/components/motion/scan-transition";
import { QuizUnavailable } from "./_components/quiz-unavailable";

type QuizErrorProps = {
	error: Error & { digest?: string };
	reset: () => void;
};

/** The quiz content could not be loaded (see ./page.tsx). Calm, no details, two ways out. */
export default function QuizError({ error, reset }: QuizErrorProps) {
	const router = useRouter();

	useEffect(() => {
		console.error("[quiz] the quiz could not be loaded:", error);
	}, [error]);

	// A server-rendered error needs fresh server data: refresh, then clear the boundary.
	const retry = () => {
		startTransition(() => {
			router.refresh();
			reset();
		});
	};

	return (
		<QuizUnavailable
			title="โหลดแบบทดสอบไม่สำเร็จ"
			description="อาจเป็นปัญหาชั่วคราวของการเชื่อมต่อ ลองอีกครั้ง หรือกลับไปเริ่มที่หน้าแรก"
			actions={
				<>
					<Button type="button" variant="spark" size="lg" block onClick={retry}>
						<IconRefresh aria-hidden stroke={2.25} />
						ลองอีกครั้ง
					</Button>
					<Button asChild variant="quiet" size="md" block>
						<TransitionLink href="/">
							<IconHome aria-hidden stroke={2.25} />
							กลับหน้าแรก
						</TransitionLink>
					</Button>
				</>
			}
		/>
	);
}
