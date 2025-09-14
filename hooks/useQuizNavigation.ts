"use client";

import { useRouter } from "next/navigation";
import { useQuizResultStore } from "@/store/quiz-store";
import { QuizService } from "@/lib/services/quiz.service";

interface QuizNavigationOptions {
	currentIndex: number;
	isLastQuestion: boolean;
	setCurrentIndex: (index: number) => void;
	setIsTransitioning: (transitioning: boolean) => void;
	resetQuestionState: () => void;
}

/**
 * Custom hook for managing quiz navigation and completion
 * Handles moving between questions and final quiz submission
 */
export function useQuizNavigation({
	currentIndex,
	isLastQuestion,
	setCurrentIndex,
	setIsTransitioning,
	resetQuestionState,
}: QuizNavigationOptions) {
	const router = useRouter();

	// Go to next question or complete quiz
	const goToNextQuestion = async () => {
		resetQuestionState();

		if (!isLastQuestion) {
			// Move to next question
			setCurrentIndex(currentIndex + 1);
		} else {
			// Complete quiz and navigate to survey
			await completeQuiz();
			router.push("/survey");
		}
	};

	// Handle reset button (next question or complete quiz)
	const handleReset = () => {
		if (isLastQuestion) {
			// If last question, complete immediately
			completeQuizAndNavigate();
			return;
		}

		// For other questions, show transition then go to next
		setIsTransitioning(true);
		setTimeout(() => {
			goToNextQuestion();
			setIsTransitioning(false);
		}, 2000);
	};

	// Complete quiz and submit results
	const completeQuiz = async () => {
		try {
			const { sessionId, responses, totalQuestions } = useQuizResultStore.getState();
			const correctAnswers = responses.filter((r) => r.isCorrect).length;
			const deviceInfo = QuizService.getDeviceInfo();

			if (sessionId) {
				await QuizService.submitQuizResponse({
					session_id: sessionId,
					total_questions: totalQuestions,
					correct_answers: correctAnswers,
					device_type: deviceInfo.type,
					user_agent: deviceInfo.userAgent,
				});
			}
		} catch (err) {
			console.error("Failed to save quiz summary:", err);
		}
	};

	// Complete quiz and navigate (for immediate completion)
	const completeQuizAndNavigate = () => {
		(async () => {
			await completeQuiz();
			router.push("/survey");
		})();
	};

	return {
		goToNextQuestion,
		handleReset,
		completeQuiz,
	};
}