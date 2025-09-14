"use client";

import { useState, useEffect } from "react";
import { useQuizResultStore } from "@/store/quiz-store";
import type { QuestionWithAnswers } from "@/lib/types";

interface QuizSessionState {
	currentIndex: number;
	selectedAnswer: string | null;
	showResult: boolean;
	isTransitioning: boolean;
	isQuizReady: boolean;
}

interface QuizSessionActions {
	setCurrentIndex: (index: number) => void;
	setSelectedAnswer: (answerId: string | null) => void;
	setShowResult: (show: boolean) => void;
	setIsTransitioning: (transitioning: boolean) => void;
	handleAnswerSelect: (answerId: string) => void;
	resetQuestionState: () => void;
}

/**
 * Custom hook for managing quiz session state and interactions
 * Extracted from QuizClient for better separation of concerns
 */
export function useQuizSession(questions: QuestionWithAnswers[]) {
	const addResponse = useQuizResultStore((state) => state.addResponse);
	const startQuiz = useQuizResultStore((state) => state.startQuiz);

	// Quiz session state
	const [currentIndex, setCurrentIndex] = useState(0);
	const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
	const [showResult, setShowResult] = useState(false);
	const [isTransitioning, setIsTransitioning] = useState(false);
	const [isQuizReady, setIsQuizReady] = useState(false);

	// Initialize quiz session
	useEffect(() => {
		try {
			startQuiz(questions.length);

			// Wait for transition to complete before showing quiz content
			const timer = setTimeout(() => {
				setIsQuizReady(true);
			}, 100);

			return () => clearTimeout(timer);
		} catch (error) {
			console.error("Error starting quiz:", error);
			// Fallback: set quiz ready even if store fails
			setIsQuizReady(true);
		}
	}, [startQuiz, questions.length]);

	// Current question derived state
	const currentQuestion = questions[currentIndex];
	const isLastQuestion = currentIndex === questions.length - 1;

	// Answer selection handler
	const handleAnswerSelect = (answerId: string) => {
		if (showResult) return;
		
		setSelectedAnswer(answerId);
		setShowResult(true);

		// Find the selected answer and add response to store
		const currentQuestion = questions[currentIndex];
		const answer = currentQuestion?.answers?.find((a: any) => a.id === answerId);
		
		addResponse({
			questionId: currentQuestion.id,
			isCorrect: answer?.isCorrect || answer?.is_correct || false,
		});
	};

	// Special handler for PIN scenario (first question)
	const handlePinScenarioAnswer = (isCorrect: boolean) => {
		if (showResult) return;
		
		console.log("[DEBUG] handlePinScenarioAnswer received:", isCorrect);
		setShowResult(true);
		
		// Add response for PIN scenario (no answerId needed)
		addResponse({
			questionId: currentQuestion.id,
			isCorrect,
		});
		console.log("[DEBUG] Added response to store:", { 
			questionId: currentQuestion.id, 
			isCorrect 
		});
	};

	// Reset question state for next question
	const resetQuestionState = () => {
		setShowResult(false);
		setSelectedAnswer(null);
	};

	// State and actions object
	const state: QuizSessionState = {
		currentIndex,
		selectedAnswer,
		showResult,
		isTransitioning,
		isQuizReady,
	};

	const actions: QuizSessionActions = {
		setCurrentIndex,
		setSelectedAnswer,
		setShowResult,
		setIsTransitioning,
		handleAnswerSelect,
		resetQuestionState,
	};

	return {
		// State
		...state,
		currentQuestion,
		isLastQuestion,
		
		// Actions
		...actions,
		handlePinScenarioAnswer,
	};
}