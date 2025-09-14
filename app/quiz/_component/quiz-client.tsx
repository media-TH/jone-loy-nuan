"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { QuizResult, QuestionWithAnswers } from "@/lib/types";

// Custom Hooks
import { useQuizSession } from "@/hooks/useQuizSession";
import { useQuizNavigation } from "@/hooks/useQuizNavigation";
import { useQuizAnswers } from "@/hooks/useQuizAnswers";

// Components
import { ContentArea } from "@/components/content-area";
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
	const [questions] = useState(initialQuestions);
	
	// Custom hooks for separated concerns
	const quizSession = useQuizSession(questions);
	const quizNavigation = useQuizNavigation({
		currentIndex: quizSession.currentIndex,
		isLastQuestion: quizSession.isLastQuestion,
		setCurrentIndex: quizSession.setCurrentIndex,
		setIsTransitioning: quizSession.setIsTransitioning,
		resetQuestionState: quizSession.resetQuestionState,
	});
	const { answers, isCorrect } = useQuizAnswers({
		currentQuestion: quizSession.currentQuestion,
		selectedAnswer: quizSession.selectedAnswer,
		showResult: quizSession.showResult,
	});

	// Loading state ถ้ายังไม่มี currentQuestion หรือยังไม่พร้อม
	if (!quizSession.currentQuestion || !quizSession.isQuizReady) {
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
			<QuizBackground showResult={quizSession.showResult}>
				<motion.div
					className="h-[100dvh] relative flex flex-col p-4 md:p-8"
					animate={{
						scale: quizSession.showResult ? 0.95 : 1,
						opacity: quizSession.showResult ? 0.7 : 1,
					}}
					transition={{ duration: 1.2, ease: "easeInOut" }}
				>
					{/* Content Area */}
					<div className="relative w-full h-full flex flex-col">
						{/* Question Section */}
						<div className="flex justify-end items-end basis-[15%] sm:basis-[18%] md:basis-[20%] pt-2 sm:pt-4 md:pt-5 pb-2 sm:pb-3 md:pb-4">
							<div className="w-full max-w-[95%] sm:max-w-md md:max-w-lg mx-auto">
								<QuestionSection
									question={quizSession.currentQuestion?.question_text ?? ""}
									showResult={quizSession.showResult}
								/>
							</div>
						</div>

						{/* Content Area */}
						<div className="basis-[60%] sm:basis-[57%] md:basis-[55%] flex items-center justify-center py-2 sm:py-4">
							<ContentArea
								questionData={quizSession.currentQuestion}
								showResult={quizSession.showResult}
								variant="fullscreen"
								// ส่ง onPinScenarioAnswer เฉพาะข้อแรก
								onPinScenarioAnswer={
									quizSession.currentQuestion.order_index === 1
										? quizSession.handlePinScenarioAnswer
										: undefined
								}
							/>
						</div>

						{/* Answer Panel */}
						<div className="basis-[25%] pb-4 sm:pb-6 md:pb-8">
							{/* ข้อแรกไม่ต้องแสดง AnswerPanel */}
							{quizSession.currentQuestion.order_index !== 1 && (
								<div className="w-full max-w-[95%] sm:max-w-md md:max-w-lg mx-auto">
									<AnswerPanel
										answers={answers}
										selectedAnswer={quizSession.selectedAnswer}
										showResult={quizSession.showResult}
										onAnswerSelect={quizSession.handleAnswerSelect}
									/>
								</div>
							)}
						</div>
					</div>
				</motion.div>
			</QuizBackground>

			{/* Result Card - ตอนนี้จะติดขอบล่าง */}
			<ResultCard
				showResult={quizSession.showResult}
				isCorrect={isCorrect}
				result={quizSession.currentQuestion.result as unknown as QuizResult}
				onReset={quizNavigation.handleReset}
				isLoading={quizSession.isTransitioning}
				isLastQuestion={quizSession.isLastQuestion}
			/>

			{/* Red Flag Overlay - Independent from all other opacity effects */}
			<RedFlagOverlay 
				show={quizSession.showResult} 
				questionOrderIndex={quizSession.currentQuestion.order_index}
			/>
		</div>
	);
}
