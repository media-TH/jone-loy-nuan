import type { Metadata } from "next";
import { IconAlertTriangle, IconHome } from "@tabler/icons-react";
import { Button } from "@/components/ds/button";
import { StatusBadge } from "@/components/ds/status-badge";
import { TransitionLink } from "@/components/motion/scan-transition";
import { privatePageRobots } from "@/lib/seo/metadata";
import { RetryButton } from "./retry-button";

/** /error — where failed server actions (e.g. sign-in) redirect. Calm, no details, two ways out. */
export const metadata: Metadata = {
	title: "เกิดข้อผิดพลาด",
	robots: privatePageRobots,
};

export default function ErrorPage() {
	return (
		<main id="main" className="min-h-screen bg-surface text-ink">
			<header className="mx-auto flex w-full max-w-[30rem] px-4 sm:px-6">
				<TransitionLink
					href="/"
					className="focus-ring -mx-2 inline-flex min-h-14 items-center rounded-xs px-2 font-display text-lg font-bold text-ink"
				>
					สแกนโจร<span className="text-brand">.online</span>
				</TransitionLink>
			</header>
			<div className="mx-auto w-full max-w-[30rem] px-4 pt-6 pb-12 sm:px-6">
				<section
					aria-labelledby="error-title"
					className="flex flex-col items-center gap-5 rounded-lg bg-surface-raised px-6 py-10 text-center shadow-raised"
				>
					<StatusBadge tone="caution" icon={<IconAlertTriangle stroke={2.25} />}>
						เกิดข้อผิดพลาด
					</StatusBadge>
					<div className="flex flex-col gap-2">
						<h1 id="error-title" className="type-title text-ink">
							ขออภัย ทำรายการนี้ไม่สำเร็จ
						</h1>
						<p className="type-body text-ink-muted">
							อาจเป็นปัญหาชั่วคราวของการเชื่อมต่อหรือข้อมูลที่กรอก
							ลองอีกครั้ง หรือกลับไปเริ่มที่หน้าแรก
						</p>
					</div>
					<div className="flex w-full flex-col gap-3">
						<RetryButton />
						<Button asChild variant="quiet" size="md" block>
							<TransitionLink href="/">
								<IconHome aria-hidden stroke={2.25} />
								กลับหน้าแรก
							</TransitionLink>
						</Button>
					</div>
				</section>
			</div>
		</main>
	);
}
