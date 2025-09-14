"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

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
    // Cross-fade two static gradient layers to avoid animating background strings
    const lightBase = "linear-gradient(to bottom, #dbeafe, #bfdbfe)";
    // Use dark blue tones for result state
    const lightResult = "linear-gradient(to bottom, #003a70, #001c3a)";
    const darkBase = "linear-gradient(to bottom, #1e293b, #334155)";
    const darkResult = "linear-gradient(to bottom, #003a70, #001c3a)";

    const baseBg = theme === "dark" ? darkBase : lightBase;
    const resultBg = theme === "dark" ? darkResult : lightResult;

    const fallbackBg = showResult ? "#001c3a" : theme === "dark" ? "#1e293b" : "#bfdbfe";

    return (
        <div
            className="h-[100dvh] flex flex-col relative overflow-x-hidden overflow-y-auto"
            style={{ backgroundColor: fallbackBg }}
        >
            <motion.div
                aria-hidden
                className="absolute inset-0 -z-10"
                style={{ background: baseBg }}
                initial={{ opacity: showResult ? 0 : 1 }}
                animate={{ opacity: showResult ? 0 : 1 }}
            />
            <motion.div
                aria-hidden
                className="absolute inset-0 -z-10"
                style={{ background: resultBg }}
                initial={{ opacity: showResult ? 1 : 0 }}
                animate={{ opacity: showResult ? 1 : 0 }}
            />
            {children}
        </div>
    );
};
