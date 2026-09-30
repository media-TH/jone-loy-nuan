import type { PlacedRedFlag } from "@/components/ds/red-flag-pin";
import type { Question, RedFlag, Scenario } from "@/lib/content/types";

/** What the player chose for one question. `answerId` is null when the content has no matching answer. */
export type QuizAnswer = {
	answerId: string | null;
	isCorrect: boolean;
};

/** Props every scenario renderer receives; `scenario` is narrowed to the renderer's kind. */
export type ScenarioViewProps<S extends Scenario = Scenario> = {
	scenario: S;
	question: Question;
	/** The question has been answered: show the reveal state and plant the red flags. */
	revealed: boolean;
	/** Replays the Scan Reveal pass when it changes (the question id). */
	scanKey: string;
	/** The question's red flags that carry an x/y anchor, planted over the scenario once revealed. */
	placedFlags: readonly PlacedRedFlag[];
	/** The first scenario on the page: load its media eagerly (it is the LCP candidate). */
	priority?: boolean;
	/** Scenarios that collect the answer themselves (pin-entry) report it here. */
	onAnswer: (answer: QuizAnswer) => void;
};

/** Red flags that can be pinned onto the scenario (both coordinates set), in number order. */
export function placedRedFlags(flags: readonly RedFlag[]): PlacedRedFlag[] {
	const placed: PlacedRedFlag[] = [];
	for (const { number, label, x, y } of flags) {
		if (x !== undefined && y !== undefined) placed.push({ number, label, x, y });
	}
	return placed.sort((a, b) => a.number - b.number);
}
