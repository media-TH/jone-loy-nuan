import type { ReactNode } from "react";
import { IconAlertTriangle } from "@tabler/icons-react";
import { StatusBadge } from "@/components/ds/status-badge";
import { TransitionLink } from "@/components/motion/scan-transition";

type QuizUnavailableProps = {
	title: string;
	description: string;
	/** The ways out: one spark action first, then quiet ones. */
	actions: ReactNode;
};

/** Calm full-page state for when the quiz cannot be shown (no published quiz, or loading failed). */
export function QuizUnavailable({ title, description, actions }: QuizUnavailableProps) {
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
					aria-labelledby="quiz-unavailable-title"
					className="flex flex-col items-center gap-5 rounded-lg bg-surface-raised px-6 py-10 text-center shadow-raised"
				>
					<StatusBadge tone="caution" icon={<IconAlertTriangle stroke={2.25} />}>
						แบบทดสอบยังไม่พร้อม
					</StatusBadge>
					<div className="flex flex-col gap-2">
						<h1 id="quiz-unavailable-title" className="type-title text-ink">
							{title}
						</h1>
						<p className="type-body text-ink-muted">{description}</p>
					</div>
					<div className="flex w-full flex-col gap-3">{actions}</div>
				</section>
			</div>
		</main>
	);
}
