"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import PinScenario from "@/app/(main)/quiz/_component/pin-scenario";
import { useQuizAnimations } from "@/hooks/useQuizAnimations";
import type { QuestionWithAnswers } from "@/lib/types";
import {
	QUIZ_MOTION_TOKENS,
	reduceMotionTransition,
} from "@/lib/motion/quiz-motion";

/** Content shape when question has image URLs (for content-area only). */
type ContentWithImages = { images?: { normal?: string; result?: string } };

interface ContentAreaProps {
	questionData: QuestionWithAnswers;
	showResult: boolean;
	variant?: "fullscreen" | "preview";
	onPinScenarioAnswer?: (isCorrect: boolean) => void;
}

export function ContentArea({
	questionData,
	showResult,
	onPinScenarioAnswer,
}: ContentAreaProps) {
	const { getContentMotionProps } = useQuizAnimations(showResult);
	const prefersReducedMotion = useReducedMotion();
	const tokens = QUIZ_MOTION_TOKENS;
	// สำหรับข้อแรก (PIN Scenario)
	if (questionData.order_index === 1) {
		return (
			<div className="w-full h-full flex items-center justify-center">
				<PinScenario onAnswer={onPinScenarioAnswer} disabled={showResult} />
			</div>
		);
	}

	// สำหรับข้ออื่นๆ (รูปภาพ) พร้อม fallback
	const content = questionData.content as ContentWithImages | undefined;
	const normalImageUrl = content?.images?.normal ??
		`/images/scenarios/question-${questionData.order_index}/normal.svg`;
	const resultImageUrl = content?.images?.result ??
		`/images/scenarios/question-${questionData.order_index}/result.svg`;

	if (!normalImageUrl && !resultImageUrl) {
		return (
			<div className="w-full h-full flex items-center justify-center">
				<div className="text-center text-gray-500">
					<p>ไม่มีรูปภาพสำหรับคำถามนี้</p>
				</div>
			</div>
		);
	}

	return (
		<div className="w-full h-full flex items-center justify-center">
			<motion.div
				className="relative w-full max-w-md aspect-square"
				{...getContentMotionProps()}
			>
				{/* Normal Image */}
				{normalImageUrl && (
					<motion.div
						className="absolute inset-0"
						animate={{
							opacity: showResult ? 0 : 1,
							scale: showResult ? tokens.scale.imageOut : 1,
						}}
						transition={reduceMotionTransition(prefersReducedMotion ?? false, {
							duration: tokens.durations.slow,
						})}
					>
						<Image
							src={normalImageUrl}
							alt="Normal state"
							fill
							className="object-contain"
							priority
						/>
					</motion.div>
				)}

				{/* Result Image */}
				{resultImageUrl && showResult && (
					<motion.div
						className="absolute inset-0"
						initial={{ opacity: 0, scale: tokens.scale.imageIn }}
						animate={{ opacity: 1, scale: 1 }}
						transition={reduceMotionTransition(prefersReducedMotion ?? false, {
							duration: tokens.durations.slow,
							delay: tokens.delays.content,
						})}
					>
						<Image
							src={resultImageUrl}
							alt="Result state"
							fill
							className="object-contain"
							priority
						/>
					</motion.div>
				)}
			</motion.div>
		</div>
	);
}
