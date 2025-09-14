"use client";

import { useMemo } from "react";
import { useQuizResultStore } from "@/store/quiz-store";
import { transformDbAnswers, isAnswerCorrect } from "@/lib/transforms/quiz.transforms";
import type { Answer, QuestionWithAnswers } from "@/lib/types";

interface UseQuizAnswersProps {
	currentQuestion: QuestionWithAnswers;
	selectedAnswer: string | null;
	showResult: boolean;
}

/**
 * Custom hook for managing quiz answers and correctness logic
 * Handles answer transformation and correctness calculation
 */
export function useQuizAnswers({
	currentQuestion,
	selectedAnswer,
	showResult,
}: UseQuizAnswersProps) {
	// Transform answers from DB format to frontend format
	const answers = useMemo((): Answer[] => {
		if (!currentQuestion?.answers || !Array.isArray(currentQuestion.answers)) {
			return [];
		}
		return transformDbAnswers(currentQuestion.answers as any[]);
	}, [currentQuestion?.answers]);

	// Calculate if the selected answer is correct
	const isCorrect = useMemo(() => {
		// Special case for PIN Scenario (first question)
		// Get correctness from store instead of selectedAnswer
		if (currentQuestion.order_index === 1) {
			const { responses } = useQuizResultStore.getState();
			const currentResponse = responses.find(r => r.questionId === currentQuestion.id);			
			return currentResponse?.isCorrect || null;
		}
		
		// For other questions, use selectedAnswer
		if (!selectedAnswer) return null;
		return isAnswerCorrect(answers, selectedAnswer);
	}, [answers, selectedAnswer, currentQuestion, showResult]);

	return {
		answers,
		isCorrect,
	};
}