import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Answer, QuizResult, QuestionWithAnswers } from "@/lib/types";
import { useQuizResultStore } from "@/store/quiz-store";
import { QuizService } from "@/lib/services/quiz.service";
import { getOrCreateAnonymousUser } from "@/lib/services/anonymous-user.service";
import { transformDbAnswers, isAnswerCorrect } from "@/lib/transforms/quiz.transforms";

interface UseQuizProps {
    initialQuestions: QuestionWithAnswers[];
}
interface UseQuizReturn {
    // State
    currentQuestion: QuestionWithAnswers;
    currentIndex: number;
    answers: Answer[];
    selectedAnswer: string | null;
    showResult: boolean;
    isTransitioning: boolean;
    isQuizReady: boolean;
    isLastQuestion: boolean;
    isCorrect: boolean | null;

    // Actions
    handleAnswerSelect: (answerId: string) => void;
    handlePinScenarioAnswer: (isCorrect: boolean) => void;
    handleReset: () => void;
    goToNextQuestion: () => Promise<void>;

    // Quiz Summary
    summary: { score: number; total: number; percentage: number };
}

export function useQuiz({ initialQuestions }: UseQuizProps): UseQuizReturn {
    const router = useRouter();

    // Zustand store
    const startQuiz = useQuizResultStore((state) => state.startQuiz);
    const addResponse = useQuizResultStore((state) => state.addResponse);
    const getSummary = useQuizResultStore((state) => state.getSummary);

    // Local state
    const [questions] = useState(initialQuestions);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isQuizReady, setIsQuizReady] = useState(false);

    // Initialize quiz
    useEffect(() => {
        try {
            startQuiz(initialQuestions.length);

            const timer = setTimeout(() => {
                setIsQuizReady(true);
            }, 100);

            return () => clearTimeout(timer);
        } catch (error) {
            console.error("Error starting quiz:", error);
            setIsQuizReady(true);
        }
    }, [startQuiz, initialQuestions.length]);

    // Computed values
    const currentQuestion = useMemo(() => {
        return questions[currentIndex];
    }, [questions, currentIndex]);

    const answers = useMemo((): Answer[] => {
        if (!currentQuestion?.answers || !Array.isArray(currentQuestion.answers)) {
            return [];
        }
        return transformDbAnswers(currentQuestion.answers as any[]);
    }, [currentQuestion]);

    const isCorrect = useMemo(() => {
        if (!selectedAnswer) return null;
        return isAnswerCorrect(answers, selectedAnswer);
    }, [answers, selectedAnswer]);

    const isLastQuestion = currentIndex === questions.length - 1;
    const summary = getSummary();

    // Actions
    const handleAnswerSelect = useCallback((answerId: string) => {
        if (showResult) return;

        setSelectedAnswer(answerId);
        setShowResult(true);

        const answer = answers.find((a) => a.id === answerId);
        addResponse({
            questionId: currentQuestion.id,
            answerId: answerId || null,
            isCorrect: answer?.isCorrect || false,
            kpiCategoryId: currentQuestion.kpi_category || "SCAM_RECOGNITION",
            questionOrder: currentQuestion.order_index,
        });
    }, [showResult, answers, addResponse, currentQuestion]);

    const handlePinScenarioAnswer = useCallback((isCorrect: boolean) => {
        if (showResult) return;

        setShowResult(true);
        addResponse({
            questionId: currentQuestion.id,
            answerId: null,
            isCorrect,
            kpiCategoryId: currentQuestion.kpi_category || "SCAM_RECOGNITION",
            questionOrder: currentQuestion.order_index,
        });
    }, [showResult, addResponse, currentQuestion]);

    const goToNextQuestion = useCallback(async () => {
        setShowResult(false);
        setSelectedAnswer(null);

        if (!isLastQuestion) {
            setCurrentIndex((prevIndex) => prevIndex + 1);
        } else {
            // Complete quiz and navigate to survey
            try {
                const { sessionId, responses, totalQuestions } = useQuizResultStore.getState();
                const correctAnswers = responses.filter((r) => r.isCorrect).length;
                const deviceInfo = QuizService.getDeviceInfo();

                if (sessionId) {
                    const anon = getOrCreateAnonymousUser();
                    const ensuredAnonymousId = anon.id.startsWith('user_') ? anon.id : `user_${anon.id}`;
                    await QuizService.submitQuizResponse({
                        session_id: sessionId,
                        total_questions: totalQuestions,
                        correct_answers: correctAnswers,
                        device_fingerprint: deviceInfo.type,
                        anonymous_user_id: ensuredAnonymousId,
                    });
                }
            } catch (err) {
                console.error("Failed to save quiz summary:", err);
            }
            router.push("/survey");
        }
    }, [isLastQuestion, router]);

    const handleReset = useCallback(() => {
        if (isLastQuestion) {
            // Complete quiz immediately for last question
            (async () => {
                try {
                    const { sessionId, responses, totalQuestions } = useQuizResultStore.getState();
                    const correctAnswers = responses.filter((r) => r.isCorrect).length;
                    const deviceInfo = QuizService.getDeviceInfo();

                    if (sessionId) {
                        const anon = getOrCreateAnonymousUser();
                        const ensuredAnonymousId = anon.id.startsWith('user_') ? anon.id : `user_${anon.id}`;
                        await QuizService.submitQuizResponse({
                            session_id: sessionId,
                            total_questions: totalQuestions,
                            correct_answers: correctAnswers,
                            device_fingerprint: deviceInfo.type,
                            anonymous_user_id: ensuredAnonymousId,
                        });
                    }
                } catch (err) {
                    console.error("Failed to save quiz summary:", err);
                }
                router.push("/survey");
            })();
            return;
        }

        // Transition to next question
        setIsTransitioning(true);
        setTimeout(() => {
            goToNextQuestion();
            setIsTransitioning(false);
        }, 2000);
    }, [isLastQuestion, goToNextQuestion, router]);

    return {
        // State
        currentQuestion,
        currentIndex,
        answers,
        selectedAnswer,
        showResult,
        isTransitioning,
        isQuizReady,
        isLastQuestion,
        isCorrect,

        // Actions
        handleAnswerSelect,
        handlePinScenarioAnswer,
        handleReset,
        goToNextQuestion,

        // Summary
        summary,
    };
}
