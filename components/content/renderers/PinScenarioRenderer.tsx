"use client";

import PinScenario from "@/app/quiz/_component/pin-scenario";

interface PinScenarioRendererProps {
	onAnswer?: (isCorrect: boolean) => void;
	disabled: boolean;
}

/**
 * PIN Scenario Renderer - Dedicated renderer for interactive PIN scenario
 * Encapsulates PIN scenario logic away from generic content area
 */
export function PinScenarioRenderer({ onAnswer, disabled }: PinScenarioRendererProps) {
	return (
		<div className="w-full h-full flex items-center justify-center">
			<PinScenario onAnswer={onAnswer} disabled={disabled} />
		</div>
	);
}