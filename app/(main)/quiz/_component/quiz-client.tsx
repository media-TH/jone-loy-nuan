"use client";

import { ContentArea } from "@/components/content-area";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Answer, QuizResult, QuestionWithAnswers } from "@/lib/types";
import { useQuizResultStore } from "@/store/quiz-store";
import { motion } from "framer-motion";
import { QuizService } from "@/lib/services/quiz.service";
import { getOrCreateAnonymousUser } from "@/lib/services/anonymous-user.service";
import { transformDbAnswers, isAnswerCorrect } from "@/lib/transforms/quiz.transforms";

// Components
import { QuestionSection } from "./question-section";
import { AnswerPanel } from "./answer-panel";
import { ResultCard } from "./result-card";
import { QuizBackground } from "./quiz-background";
import { RedFlagOverlay } from "@/components/red-flag-overlay";

export function QuizClient({
	initialQuestions,
}: {
	initialQuestions: QuestionWithAnswers[];
}) {
	const router = useRouter();

	// Zustand store hooks with error handling
	const startQuiz = useQuizResultStore((state) => state.startQuiz);
	const addResponse = useQuizResultStore((state) => state.addResponse);

	// --- State Management ---
	const [questions] = useState(initialQuestions);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
	const [showResult, setShowResult] = useState(false);
	const [isTransitioning, setIsTransitioning] = useState(false);
	const [isQuizReady, setIsQuizReady] = useState(false);

	// Start quiz session on component mount
	useEffect(() => {
		try {
			startQuiz(initialQuestions.length);
			const timer = setTimeout(() => setIsQuizReady(true), 100);
			return () => clearTimeout(timer);
		} catch (error) {
			console.error("Error starting quiz:", error);
			setIsQuizReady(true);
		}
	}, [startQuiz, initialQuestions.length]);

	const currentQuestion = useMemo(() => questions[currentIndex], [questions, currentIndex]);

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

	const handleAnswerSelect = (answerId: string) => {
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
	};

	const goToNextQuestion = async () => {
		setShowResult(false);
		setSelectedAnswer(null);

		if (!isLastQuestion) {
			setCurrentIndex((prevIndex) => prevIndex + 1);
		} else {
			// Complete quiz: save summary then navigate
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
	};

	const handlePinScenarioAnswer = (isCorrect: boolean) => {
		if (showResult) return;
		setShowResult(true);
		addResponse({
			questionId: currentQuestion.id,
			answerId: null,
			isCorrect,
			kpiCategoryId: currentQuestion.kpi_category || "SCAM_RECOGNITION",
			questionOrder: currentQuestion.order_index,
		});
	};

	const handleReset = () => {
		if (isLastQuestion) {
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

		setIsTransitioning(true);
		setTimeout(() => {
			goToNextQuestion();
			setIsTransitioning(false);
		}, 2000);
	};

	// Loading state ถ้ายังไม่มี currentQuestion หรือยังไม่พร้อม
	if (!currentQuestion || !isQuizReady) {
		return (
			<div className="h-[100dvh] bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
				<div className="text-center">
					<div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
					<div className="text-gray-500">กำลังเตรียมคำถาม...</div>
				</div>
			</div>
		);
	}

	return (
		<div className="relative h-[100dvh] bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden">
			{/* Quiz Background */}
			<QuizBackground showResult={showResult}>
				<motion.div
					className="h-[100dvh] relative flex flex-col p-4 md:p-8"
					animate={{
						scale: showResult ? 0.95 : 1,
						opacity: showResult ? 0.7 : 1,
					}}
					transition={{ duration: 1.2, ease: "easeInOut" }}
				>
					{/* Content Area */}
					<div className="relative w-full h-full flex flex-col">
						{/* Question Section */}
						<div className="flex justify-end items-end basis-[15%] sm:basis-[18%] md:basis-[20%] pt-2 sm:pt-4 md:pt-5 pb-2 sm:pb-3 md:pb-4">
							<div className="w-full max-w-[95%] sm:max-w-md md:max-w-lg mx-auto">
								<QuestionSection
									question={currentQuestion?.question_text ?? ""}
									showResult={showResult}
								/>
							</div>
						</div>

						{/* Content Area */}
						<div className="basis-[60%] sm:basis-[57%] md:basis-[55%] flex items-center justify-center py-2 sm:py-4">
							<ContentArea
								questionData={currentQuestion}
								showResult={showResult}
								variant="fullscreen"
								// ส่ง onPinScenarioAnswer เฉพาะข้อแรก
								onPinScenarioAnswer={
									currentQuestion.order_index === 1
										? handlePinScenarioAnswer
										: undefined
								}
							/>
						</div>

						{/* Answer Panel */}
						<div className="basis-[25%] pb-4 sm:pb-6 md:pb-8">
							{/* ข้อแรกไม่ต้องแสดง AnswerPanel */}
							{currentQuestion.order_index !== 1 && (
								<div className="w-full max-w-[95%] sm:max-w-md md:max-w-lg mx-auto">
									<AnswerPanel
										answers={answers}
										selectedAnswer={selectedAnswer}
										showResult={showResult}
										onAnswerSelect={handleAnswerSelect}
									/>
								</div>
							)}
						</div>
					</div>
				</motion.div>
			</QuizBackground>

			{/* Result Card - ตอนนี้จะติดขอบล่าง */}
			<ResultCard
				showResult={showResult}
				isCorrect={isCorrect}
				result={currentQuestion.result as unknown as QuizResult}
				category={currentQuestion.category}
				onReset={handleReset}
				isLoading={isTransitioning}
				isLastQuestion={isLastQuestion}
			/>

			{/* Red Flag Overlay - Independent from all other opacity effects */}
			<RedFlagOverlay 
				show={showResult} 
				questionOrderIndex={currentQuestion.order_index}
			/>
		</div>
	);
}
