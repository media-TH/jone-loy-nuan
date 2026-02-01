import type { QuestionWithAnswers } from "@/lib/types";
import { fetchQuestionById } from "@/lib/actions/questions";
import { QuizUpsertForm } from "../../quiz-form";

// ✨ The BIG REVEAL for Next.js 15: `params` is a Promise for async pages!
interface EditQuizPageProps {
	params: Promise<{ id: string }>;
}

/** Normalize DB row (Json | null) to form shape (Record | undefined). */
function toFormInitialData(
	row: Awaited<ReturnType<typeof fetchQuestionById>>
): Partial<QuestionWithAnswers> | null {
	if (!row) return null;
	const content =
		row.content != null && typeof row.content === "object" && !Array.isArray(row.content)
			? (row.content as Record<string, unknown>)
			: undefined;
	const result =
		row.result != null && typeof row.result === "object" && !Array.isArray(row.result)
			? (row.result as Record<string, unknown>)
			: undefined;
	const answers = Array.isArray(row.answers)
		? (row.answers as QuestionWithAnswers["answers"])
		: undefined;
	return {
		...row,
		content,
		result,
		answers,
	};
}

export default async function EditQuizPage({ params }: EditQuizPageProps) {
	// We now need to `await` the params object itself.
	const { id } = await params;
	const question = await fetchQuestionById(id);

	if (!question) {
		return <p>Question not found.</p>;
	}

	const initialData = toFormInitialData(question);
	return (
		<div>
			<QuizUpsertForm initialData={initialData ?? undefined} />
		</div>
	);
}
