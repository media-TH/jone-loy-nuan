"use client";

import { ContentRenderer } from "@/components/content/ContentRenderer";
import type { QuestionWithAnswers } from "@/lib/types";

interface ContentAreaProps {
	questionData: QuestionWithAnswers;
	showResult: boolean;
	variant?: "fullscreen" | "preview";
	onPinScenarioAnswer?: (isCorrect: boolean) => void;
}

/**
 * Content Area - Simplified wrapper that delegates to ContentRenderer
 * Uses Strategy Pattern to eliminate hardcoded special cases
 */
export function ContentArea(props: ContentAreaProps) {
	return <ContentRenderer {...props} />;
}
