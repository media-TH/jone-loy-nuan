"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useQuizAnimations } from "@/hooks/useQuizAnimations";
import type {
	AnswerPanelProps,
	AnswerPanelLayout,
	ButtonVariant,
} from "@/lib/types";
import { useMemo } from "react";

export const AnswerPanel = (props: AnswerPanelProps) => {
	const {
		answers,
		selectedAnswer,
		showResult,
		onAnswerSelect,
		hideAnswers = false,
	} = props;

	// All hooks are now at the top level, respecting the Rules of Hooks.

	// 🧠 Smart Layout Detection
	const layoutInfo = useMemo(() => {
		const answerCount = answers?.length ?? 0;
		if (hideAnswers || answerCount === 0) {
			return { layout: "hidden" as const, showPanel: false };
		}

		const isHorizontal = answerCount === 2;
		const isVertical = answerCount >= 3;

		return {
			layout: (isHorizontal ? "horizontal" : "vertical") as AnswerPanelLayout,
			showPanel: true,
			isHorizontal,
			isVertical,
		};
	}, [hideAnswers, answers]);

	// 🎨 Animation Logic
	const { getAnswerPanelLayoutAnimation, getAnswerButtonLayoutAnimation } =
		useQuizAnimations(props.showResult);

	// 🎨 Layout-specific styles
	const containerStyles = useMemo(() => {
		if (!layoutInfo.showPanel) return "flex-none h-20";

		const baseStyles = "w-full flex justify-center items-center";
		if (layoutInfo.isHorizontal) {
			return `${baseStyles} flex-row gap-3 sm:gap-4 md:gap-6`;
		}
		return `${baseStyles} flex-col`;
	}, [layoutInfo]);

	const answerContainerStyles = useMemo(() => {
		if (layoutInfo.isHorizontal) {
			return "flex flex-row justify-center items-stretch gap-3 sm:gap-4 md:gap-6 w-full";
		}
		return "flex flex-col justify-center items-stretch space-y-2.5 sm:space-y-3 md:space-y-4 w-full";
	}, [layoutInfo.isHorizontal]);

	const getButtonStyles = useMemo(() => {
		return "w-full h-auto text-sm sm:text-base py-2.5 sm:py-3 md:py-4 px-3 sm:px-4 md:px-6 min-h-[44px] rounded-xl";
	}, []);

	// ⭐️ Guard Clause moved after hooks.
	// Now we conditionally render based on layoutInfo, instead of an early return.
	if (!answers || !layoutInfo.showPanel) {
		return <div className={containerStyles} />;
	}

	// 🔧 Local helpers are now inside the component body, but after the early return check.
	const getButtonVariant = (
		answerId: string,
		isCorrect: boolean
	): ButtonVariant => {
		// No answer selected yet
		if (!selectedAnswer) return "quiz";

		// The clicked answer
		if (selectedAnswer === answerId) {
			return isCorrect ? "quiz-correct" : "quiz-wrong";
		}

		// After result revealed highlight correct answer
		if (showResult && isCorrect) return "quiz-correct";

		return "quiz";
	};

	const isButtonDisabled = (answerId: string): boolean => {
		return selectedAnswer !== null && selectedAnswer !== answerId;
	};

	const getButtonDataState = (answerId: string): "selected" | "unselected" =>
		selectedAnswer === answerId ? "selected" : "unselected";

	return (
		<div className={containerStyles}>
			<motion.div
				{...getAnswerPanelLayoutAnimation(layoutInfo.layout)}
				className={answerContainerStyles}
			>
				{answers.map((option, index) => (
					<div key={option.id} className="w-full flex">
						<motion.div
							{...getAnswerButtonLayoutAnimation(index, layoutInfo.layout)}
							className="w-full"
						>
							<Button
								variant={getButtonVariant(option.id, option.isCorrect)}
								size="lg"
								onClick={() => onAnswerSelect(option.id)}
								disabled={isButtonDisabled(option.id) || showResult}
								data-state={getButtonDataState(option.id)}
								className={getButtonStyles}
							>
								{option.text}
							</Button>
						</motion.div>
					</div>
				))}
			</motion.div>
		</div>
	);
};
