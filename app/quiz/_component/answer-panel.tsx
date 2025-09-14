"use client";

import { motion, type Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useQuizAnimations } from "@/hooks/useQuizAnimations";
import type {
	AnswerPanelProps,
	AnswerPanelLayout,
	ButtonVariant,
} from "@/lib/types";
// useMemo removed - React Compiler handles optimization automatically

export const AnswerPanel = (props: AnswerPanelProps) => {
	const {
		answers,
		selectedAnswer,
		showResult,
		onAnswerSelect,
		hideAnswers = false,
	} = props;

	// All hooks are now at the top level, respecting the Rules of Hooks.

	// 🧠 Smart Layout Detection - React Compiler optimizes automatically
	const answerCount = answers?.length ?? 0;
	const showPanel = !hideAnswers && answerCount > 0;
	const isHorizontal = answerCount === 2;
	const isVertical = answerCount >= 3;
	const layout: AnswerPanelLayout = isHorizontal ? "horizontal" : "vertical";
	
	const layoutInfo = {
		layout: showPanel ? layout : ("hidden" as const),
		showPanel,
		isHorizontal,
		isVertical,
	};

	// 🎨 Animation Logic
	const { getAnswerPanelLayoutAnimation } = useQuizAnimations(props.showResult);

	// Parent/child variants with stagger for smoother sequencing
	const listVariants: Variants = {
		initial: { opacity: 1 },
		animate: {
			opacity: 1,
			transition: { staggerChildren: 0.08 },
		},
	};

	const itemVariants: Variants = {
		initial: (custom: { index: number; isHorizontal: boolean; y: number }) =>
			custom.isHorizontal
				? { opacity: 0, x: custom.index === 0 ? -20 : 20 }
				: { opacity: 0, y: custom.y },
		animate: { opacity: 1, x: 0, y: 0 },
	};

	// 🎨 Layout-specific styles - React Compiler optimizes automatically
	const getContainerStyles = () => {
		if (!layoutInfo.showPanel) return "flex-none h-20";
		
		const baseStyles = "w-full flex justify-center items-center";
		if (layoutInfo.isHorizontal) {
			return `${baseStyles} flex-row gap-3 sm:gap-4 md:gap-6`;
		}
		return `${baseStyles} flex-col`;
	};

	const getAnswerContainerStyles = () => {
		if (layoutInfo.isHorizontal) {
			return "flex flex-row justify-center items-stretch gap-3 sm:gap-4 md:gap-6 w-full";
		}
		return "flex flex-col justify-center items-stretch space-y-2.5 sm:space-y-3 md:space-y-4 w-full";
	};

	const buttonStyles = "w-full h-auto text-sm sm:text-base py-2.5 sm:py-3 md:py-4 px-3 sm:px-4 md:px-6 min-h-[44px] rounded-xl";

	// ⭐️ Guard Clause moved after hooks.
	// Now we conditionally render based on layoutInfo, instead of an early return.
	if (!answers || !layoutInfo.showPanel) {
		return <div className={getContainerStyles()} />;
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
		<div className={getContainerStyles()}>
			<motion.div
				{...getAnswerPanelLayoutAnimation(layoutInfo.layout)}
				className={getAnswerContainerStyles()}
				variants={listVariants}
				initial="initial"
				animate="animate"
			>
				{answers.map((option, index) => (
					<div key={option.id} className="w-full flex">
						<motion.div
							variants={itemVariants}
							custom={{ index, isHorizontal: layoutInfo.isHorizontal, y: 15 }}
							className="w-full"
						>
							<Button
								variant={getButtonVariant(option.id, option.isCorrect)}
								size="lg"
								onClick={() => onAnswerSelect(option.id)}
								disabled={isButtonDisabled(option.id) || showResult}
								data-state={getButtonDataState(option.id)}
								className={buttonStyles}
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
