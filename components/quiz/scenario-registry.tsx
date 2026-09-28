"use client";

import type { ComponentType } from "react";
import { ImagePairScenarioView, preloadImagePair } from "@/components/quiz/image-pair-scenario";
import { PinEntryScenarioView } from "@/components/quiz/pin-entry-scenario";
import { PlaceholderScenarioView } from "@/components/quiz/placeholder-scenario";
import type { ScenarioViewProps } from "@/components/quiz/types";
import type { Scenario, ScenarioKind } from "@/lib/content/types";

type ScenarioOf<K extends ScenarioKind> = Extract<Scenario, { kind: K }>;

export type ScenarioRenderer<K extends ScenarioKind> = {
	Component: ComponentType<ScenarioViewProps<ScenarioOf<K>>>;
	/**
	 * The scenario collects the answer itself (the PIN screen's own buttons), so the quiz shows no
	 * answer list for it and the renderer calls `onAnswer`.
	 */
	answersInScenario: boolean;
	/** Warms the cache with the scenario's media, e.g. for the question after the current one. */
	preload?: (scenario: ScenarioOf<K>) => void;
};

/**
 * Scenario.kind → renderer. The quiz decides everything scenario-specific through this table (never
 * by question position), and the mapped type makes a new kind in lib/content/types.ts a compile
 * error here until it has an entry.
 */
export const SCENARIO_RENDERERS: { [K in ScenarioKind]: ScenarioRenderer<K> } = {
	"image-pair": {
		Component: ImagePairScenarioView,
		answersInScenario: false,
		preload: preloadImagePair,
	},
	"pin-entry": {
		Component: PinEntryScenarioView,
		answersInScenario: true,
	},
	chat: { Component: PlaceholderScenarioView, answersInScenario: false },
	call: { Component: PlaceholderScenarioView, answersInScenario: false },
	sms: { Component: PlaceholderScenarioView, answersInScenario: false },
};

/**
 * The renderer for a scenario, typed for that scenario. TypeScript cannot correlate an indexed
 * access on a union key with the value it came from, hence the one cast; the mapped type above
 * guarantees every entry matches its kind.
 */
function rendererFor<S extends Scenario>(scenario: S): ScenarioRenderer<S["kind"]> & {
	Component: ComponentType<ScenarioViewProps<S>>;
	preload?: (scenario: S) => void;
} {
	return SCENARIO_RENDERERS[scenario.kind] as never;
}

/** Whether the scenario takes the answer itself (no AnswerOption list for the question). */
export function scenarioAnswersItself(scenario: Scenario): boolean {
	return rendererFor(scenario).answersInScenario;
}

/** Preloads the scenario's media when its renderer has any. */
export function preloadScenario(scenario: Scenario): void {
	rendererFor(scenario).preload?.(scenario);
}

/** Renders a question's scenario with the renderer registered for its kind. */
export function ScenarioView(props: ScenarioViewProps) {
	const { Component } = rendererFor(props.scenario);
	return <Component {...props} />;
}
