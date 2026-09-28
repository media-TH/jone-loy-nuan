import { TransitionLink } from "@/components/motion/scan-transition";
import { getQuiz, type Question } from "@/lib/content";
import { ResultView, type ReviewQuestion } from "./_components/result-view";

/**
 * /result — the score, risk level and the missed questions' red flags for this tab's quiz.
 *
 * The player's answers live in the in-memory quiz store (client). The server only adds the
 * published content the review needs (each question's title and red flags), so the result
 * never waits on the player's data and nothing personal is rendered on the server.
 * Metadata (noindex) lives in ./layout.tsx.
 */

// Same lifetime as the cached content itself (CONTENT_REVALIDATE_SECONDS).
export const revalidate = 3600;

function toReviewQuestion(question: Question): ReviewQuestion {
	return {
		id: question.id,
		order: question.order,
		category: question.category.trim(),
		title: question.result.header.trim(),
		redFlags: question.redFlags.map(({ number, label, detail }) =>
			detail ? { number, label, detail } : { number, label },
		),
	};
}

/** Review content for the missed-question list; the page still works (without it) if content is down. */
async function loadReviewQuestions(): Promise<ReviewQuestion[]> {
	try {
		const quiz = await getQuiz();
		return quiz ? quiz.questions.map(toReviewQuestion) : [];
	} catch (error) {
		console.error("[result] quiz content unavailable; showing the review without titles", error);
		return [];
	}
}

export default async function ResultPage() {
	const questions = await loadReviewQuestions();

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
			<div className="mx-auto w-full max-w-[30rem] px-4 pt-2 pb-12 sm:px-6">
				<ResultView questions={questions} />
			</div>
		</main>
	);
}
