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
	const { getBackgroundAnimation } = useQuizAnimations(showResult);

	return (
		<motion.div
			className="h-[100dvh] flex flex-col relative overflow-x-hidden overflow-y-auto"
			{...getBackgroundAnimation(theme)}
		>
			{children}
		</motion.div>
	);
};
