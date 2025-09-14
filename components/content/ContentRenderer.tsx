"use client";

import type { QuestionWithAnswers } from "@/lib/types";
import { PinScenarioRenderer } from "./renderers/PinScenarioRenderer";
import { ImageRenderer } from "./renderers/ImageRenderer";

interface ContentRendererProps {
	questionData: QuestionWithAnswers;
	showResult: boolean;
	variant?: "fullscreen" | "preview";
	onPinScenarioAnswer?: (isCorrect: boolean) => void;
}

/**
 * Content Renderer Factory - Strategy Pattern Implementation
 * Removes hardcoded special cases from ContentArea component
 */
export function ContentRenderer({
	questionData,
	showResult,
	variant = "fullscreen",
	onPinScenarioAnswer,
}: ContentRendererProps) {
	// Strategy selection based on question type/order
	const getContentType = (question: QuestionWithAnswers): string => {
		// PIN Scenario (first question)
		if (question.order_index === 1) {
			return "pin-scenario";
		}

		// Image-based questions
		if (question.normal_image_url || question.result_image_url) {
			return "image";
		}

		// Future content types can be added here
		// if (question.content_type === "video") return "video";
		// if (question.content_type === "text") return "text";

		return "image"; // Default fallback
	};

	const contentType = getContentType(questionData);

	// Strategy pattern: delegate to specific renderer
	switch (contentType) {
		case "pin-scenario":
			return (
				<PinScenarioRenderer
					onAnswer={onPinScenarioAnswer}
					disabled={showResult}
				/>
			);

		case "image":
			return (
				<ImageRenderer
					questionData={questionData}
					showResult={showResult}
					variant={variant}
				/>
			);

		default:
			return (
				<div className="w-full h-full flex items-center justify-center">
					<div className="text-center text-gray-500">
						<p>ไม่รองรับประเภทเนื้อหานี้: {contentType}</p>
					</div>
				</div>
			);
	}
}