// app/quiz/page.tsx

import { QuizClient } from "./_component/quiz-client";
import { fetchQuizQuestions } from "@/lib/actions/questions";

export default async function QuizPage() {
	let questions = await fetchQuizQuestions();
	if (questions.length > 10) {
		questions = questions.slice(0, 10);
	}

	if (!questions || questions.length === 0) {
		return <div>Failed to load quiz questions.</div>;
	}

	return <QuizClient initialQuestions={questions} />;
}
