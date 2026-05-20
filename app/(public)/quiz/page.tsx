// app/quiz/page.tsx

import { fetchQuizQuestions } from "@/lib/actions/questions";
import { rowToQuestionWithAnswers } from "@/lib/transforms/quiz.transforms";
import type { QuestionWithAnswers } from "@/lib/types";
import { QuizClient } from "./_component/quiz-client";

export default async function QuizPage() {
	let rows = await fetchQuizQuestions();
	if (rows.length > 10) {
		rows = rows.slice(0, 10);
	}

	if (!rows || rows.length === 0) {
		return <div>Failed to load quiz questions.</div>;
	}

	const questions: QuestionWithAnswers[] = rows.map(rowToQuestionWithAnswers);
	return <QuizClient initialQuestions={questions} />;
}
