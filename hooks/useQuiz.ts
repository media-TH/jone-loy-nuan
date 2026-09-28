"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ProgressResult } from "@/components/ds/progress-rail";
import { useTransitionRouter } from "@/components/motion/scan-transition";
import type { QuizAnswer } from "@/components/quiz/types";
import type { Question } from "@/lib/content/types";
import { getAnonToken } from "@/lib/services/anon-jwt.service";
import { QuizService } from "@/lib/services/quiz.service";
import { useQuizResultStore } from "@/store/quiz-store";

/** Where the player goes after the last question. */
export const QUIZ_COMPLETE_HREF = "/survey";

/**
 * The result sheet for the current question: "closed" until it first opens after an answer,
 * "open", or "dismissed" when the player closed it to look at the scenario again.
 */
export type ResultSheetState = "closed" | "open" | "dismissed";

type QuizState = {
	index: number;
	/** One entry per question; null until answered. */
	answers: (QuizAnswer | null)[];
	sheet: ResultSheetState;
};

export type UseQuizReturn = {
	question: Question;
	/** 0-based position of `question`. */
	index: number;
	total: number;
	isLastQuestion: boolean;
	/** The answer given to the current question, or null while the player is deciding. */
	response: QuizAnswer | null;
	/** Outcome per question for the progress rail. */
	results: ProgressResult[];
	sheet: ResultSheetState;
	/** The summary is being saved on the way to the survey. */
	isFinishing: boolean;
	/** Answers the current question with one of its answers (AnswerOption list). */
	selectAnswer: (answerId: string) => void;
	/** Answers the current question from the scenario itself (e.g. the PIN screen). */
	answerQuestion: (answer: QuizAnswer) => void;
	openSheet: () => void;
	dismissSheet: () => void;
	/** Next question, or on the last one: save the session summary once, then go to the survey. */
	next: () => void;
};

/** Anonymous ids are stored with the "user_" prefix (see QuizService.createSession). */
function withUserPrefix(anonUserId: string): string {
	return anonUserId.startsWith("user_") ? anonUserId : `user_${anonUserId}`;
}

/**
 * Saves the finished session's summary (question count, correct answers, device type and the
 * anonymous id, authorised by the anon JWT). Fails soft: any error is logged and the promise still
 * resolves, so the player reaches the survey even when Supabase is unavailable. QuizService
 * deduplicates per session id as well.
 */
export async function submitQuizSummary(): Promise<void> {
	try {
		const { sessionId, anonymousUserId, responses, totalQuestions } = useQuizResultStore.getState();
		if (!sessionId) return;

		const correctAnswers = responses.filter((response) => response.isCorrect).length;
		const deviceInfo = QuizService.getDeviceInfo();
		const anon = await getAnonToken();
		await QuizService.submitQuizResponse({
			session_id: sessionId,
			total_questions: totalQuestions,
			correct_answers: correctAnswers,
			device_fingerprint: deviceInfo.type,
			anonymous_user_id: anonymousUserId ?? withUserPrefix(anon.anon_user_id),
			token: anon.token,
		});
	} catch (error) {
		console.error("Failed to save quiz summary:", error);
	}
}

/**
 * Quiz flow state: the current question, the answers so far and the result sheet, plus the
 * persistence around them. The quiz store starts a session on mount, records one response per
 * answered question, and the summary is submitted exactly once at the end.
 */
export function useQuiz(questions: readonly Question[]): UseQuizReturn {
	const router = useTransitionRouter();
	const startQuiz = useQuizResultStore((state) => state.startQuiz);
	const startQuestion = useQuizResultStore((state) => state.startQuestion);
	const addResponse = useQuizResultStore((state) => state.addResponse);

	const [state, setState] = useState<QuizState>(() => ({
		index: 0,
		answers: questions.map(() => null),
		sheet: "closed",
	}));
	const [isFinishing, setIsFinishing] = useState(false);

	// Synchronous guards: a double tap or a repeated key can land before React re-renders.
	const answeredRef = useRef(new Set<string>());
	const finishingRef = useRef(false);
	const startedRef = useRef(false);

	const total = questions.length;
	const index = Math.min(state.index, Math.max(0, total - 1));
	const question = questions[index];
	const response = state.answers[index] ?? null;
	const isLastQuestion = index === total - 1;

	// One quiz session per visit (the ref keeps Strict Mode's second effect run from starting another).
	useEffect(() => {
		if (startedRef.current) return;
		startedRef.current = true;
		try {
			startQuiz(total);
		} catch (error) {
			console.error("Error starting quiz:", error);
		}
	}, [startQuiz, total]);

	const answerQuestion = useCallback(
		(answer: QuizAnswer) => {
			if (!question || answeredRef.current.has(question.id)) return;
			answeredRef.current.add(question.id);

			setState((current) => {
				if (current.answers[index]) return current;
				const answers = [...current.answers];
				answers[index] = answer;
				return { ...current, answers, sheet: "closed" };
			});
			addResponse({
				questionId: question.id,
				answerId: answer.answerId,
				isCorrect: answer.isCorrect,
				kpiCategoryId: question.kpiCategory,
				questionOrder: question.order,
			});
		},
		[addResponse, index, question],
	);

	const selectAnswer = useCallback(
		(answerId: string) => {
			const answer = question?.answers.find((candidate) => candidate.id === answerId);
			if (!answer) return;
			answerQuestion({ answerId: answer.id, isCorrect: answer.isCorrect });
		},
		[answerQuestion, question],
	);

	const setSheet = useCallback((sheet: ResultSheetState) => {
		setState((current) => (current.sheet === sheet ? current : { ...current, sheet }));
	}, []);

	const openSheet = useCallback(() => setSheet("open"), [setSheet]);
	const dismissSheet = useCallback(() => setSheet("dismissed"), [setSheet]);

	const finish = useCallback(async () => {
		if (finishingRef.current) return;
		finishingRef.current = true;
		setIsFinishing(true);
		await submitQuizSummary();
		router.push(QUIZ_COMPLETE_HREF);
	}, [router]);

	const next = useCallback(() => {
		if (!response || finishingRef.current) return;
		if (isLastQuestion) {
			void finish();
			return;
		}
		setState((current) =>
			current.index === index ? { ...current, index: index + 1, sheet: "closed" } : current,
		);
		startQuestion();
	}, [finish, index, isLastQuestion, response, startQuestion]);

	const results = useMemo<ProgressResult[]>(
		() =>
			state.answers.map((answer) => (answer === null ? null : answer.isCorrect ? "correct" : "wrong")),
		[state.answers],
	);

	return {
		question,
		index,
		total,
		isLastQuestion,
		response,
		results,
		sheet: state.sheet,
		isFinishing,
		selectAnswer,
		answerQuestion,
		openSheet,
		dismissSheet,
		next,
	};
}
