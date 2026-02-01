"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { useQuizAnimations } from "@/hooks/useQuizAnimations";

interface QuizBackgroundProps {
	children: ReactNode;
	showResult: boolean;
	theme?: "light" | "dark";
}

export const QuizBackground = ({
	children,
	showResult,
	theme = "light",
}: QuizBackgroundProps) => {
	const { getBackgroundLayers } = useQuizAnimations(showResult);
	const { baseGradient, resultGradient, transition } =
		getBackgroundLayers(theme);

	return (
		<div
			className="h-[100dvh] flex flex-col relative overflow-x-hidden overflow-y-auto"
		>
			<motion.div
				aria-hidden="true"
				className="absolute inset-0 pointer-events-none"
				style={{ background: baseGradient }}
				animate={{ opacity: showResult ? 0 : 1 }}
				transition={transition}
			/>
			<motion.div
				aria-hidden="true"
				className="absolute inset-0 pointer-events-none"
				style={{ background: resultGradient }}
				animate={{ opacity: showResult ? 1 : 0 }}
				transition={transition}
			/>
			{children}
		</div>
	);
};
