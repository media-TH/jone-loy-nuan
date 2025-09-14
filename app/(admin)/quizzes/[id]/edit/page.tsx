import { fetchQuestionById } from "@/lib/actions/questions";
import { QuizUpsertForm } from "../../quiz-form";

// ✨ The BIG REVEAL for Next.js 15: `params` is a Promise for async pages!
interface EditQuizPageProps {
	params: Promise<{ id: string }>;
}

export default async function EditQuizPage({ params }: EditQuizPageProps) {
	// We now need to `await` the params object itself.
	const { id } = await params;
	console.log("[EditQuizPage] Loading question with ID:", id);

	const question = await fetchQuestionById(id);
	console.log("[EditQuizPage] Question data:", question ? "found" : "not found");

	if (!question) {
		console.error("[EditQuizPage] Question not found for ID:", id);
		return (
			<div className="p-8 text-center">
				<h1 className="text-2xl font-bold text-red-600 mb-4">ไม่พบคำถาม</h1>
				<p className="text-gray-600 mb-4">ไม่สามารถหาคำถามที่มี ID: {id}</p>
				<a href="/x9k2m7n4p8q1/quizzes" className="text-blue-600 hover:underline">
					กลับไปหน้าจัดการคำถาม
				</a>
			</div>
		);
	}



	return (
		<div>
			<QuizUpsertForm initialData={question} />
		</div>
	);
}
