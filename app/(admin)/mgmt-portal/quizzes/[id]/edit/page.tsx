import { fetchQuestionById } from "@/lib/actions/questions";
import { QuizUpsertForm } from "../../quiz-form";

// ✨ The BIG REVEAL for Next.js 15: `params` is a Promise for async pages!
interface EditQuizPageProps {
	params: Promise<{ id: string }>;
}

export default async function EditQuizPage({ params }: EditQuizPageProps) {
	// We now need to `await` the params object itself.
	const { id } = await params;
	const question = await fetchQuestionById(id);

	if (!question) {
		return <p>Question not found.</p>;
	}

	return (
		<div>
			<QuizUpsertForm initialData={question} />
		</div>
	);
}
