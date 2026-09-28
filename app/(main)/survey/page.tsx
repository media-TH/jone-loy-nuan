import { TransitionLink } from "@/components/motion/scan-transition";
import { SurveyContent } from "./_components/survey-content";

/**
 * /survey — optional demographics after the quiz, before the result (landing → quiz → survey →
 * result). The chrome is static; the form is a client island because it reads the in-memory
 * quiz store. Metadata (noindex) lives in ./layout.tsx.
 */
export default function SurveyPage() {
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
			<div className="mx-auto flex w-full max-w-[30rem] flex-col gap-8 px-4 pt-2 pb-12 sm:px-6">
				<SurveyContent />
			</div>
		</main>
	);
}
