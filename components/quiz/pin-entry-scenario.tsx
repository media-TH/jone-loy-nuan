"use client";

import { IconBackspace } from "@tabler/icons-react";
import { useId, useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ds/button";
import { StatusIcon } from "@/components/ds/status-icon";
import { ScenarioPanel } from "@/components/quiz/scenario-panel";
import type { QuizAnswer, ScenarioViewProps } from "@/components/quiz/types";
import type { Answer, PinEntryScenario } from "@/lib/content/types";
import { cn } from "@/lib/utils";

type PinAction = "cancel" | "confirm";

/** Keypad in phone order; null is the empty bottom-left key. */
const KEYPAD = ["1", "2", "3", "4", "5", "6", "7", "8", "9", null, "0", "backspace"] as const;

const DEFAULT_LABELS: Record<PinAction, string> = {
	cancel: "ไม่กรอกรหัส",
	confirm: "ยืนยัน",
};

/**
 * The screen's two actions. Not entering the PIN is always the safe (correct) choice; the content's
 * answers, when present, name the buttons and give the answer ids to record.
 */
function pinActions(answers: readonly Answer[]): Record<PinAction, { label: string; answer: QuizAnswer }> {
	const safe = answers.find((answer) => answer.isCorrect);
	const unsafe = answers.find((answer) => !answer.isCorrect);
	return {
		cancel: {
			label: safe?.text ?? DEFAULT_LABELS.cancel,
			answer: { answerId: safe?.id ?? null, isCorrect: true },
		},
		confirm: {
			label: unsafe?.text ?? DEFAULT_LABELS.confirm,
			answer: { answerId: unsafe?.id ?? null, isCorrect: false },
		},
	};
}

/** The digit a key stands for, on any keyboard layout (Thai Kedmanee included). */
function digitFromKey(event: KeyboardEvent): string | null {
	const byCode = /^(?:Digit|Numpad)(\d)$/.exec(event.code)?.[1];
	if (byCode) return byCode;
	return /^\d$/.test(event.key) ? event.key : null;
}

/*
 * Keys that run out of use (a full PIN, nothing to delete) are aria-disabled rather than disabled,
 * so a keyboard user's focus stays where it is.
 */
const KEY_CLASS = cn(
	"focus-ring grid h-12 place-items-center rounded-sm border border-line bg-surface-raised text-ink",
	"transition-colors duration-(--dur-quick) ease-settle",
	"enabled:not-aria-disabled:hover:bg-brand-soft enabled:not-aria-disabled:active:bg-surface-sunken",
	"disabled:opacity-40 aria-disabled:cursor-not-allowed aria-disabled:opacity-40",
);

/**
 * A fake "enter your PIN" screen: the player either enters a PIN and confirms (the scam wins) or
 * refuses to enter it (correct). The digits stay in this component's state only; they are never
 * sent, stored or logged.
 */
export function PinEntryScenarioView({
	scenario,
	question,
	revealed,
	scanKey,
	placedFlags,
	onAnswer,
}: ScenarioViewProps<PinEntryScenario>) {
	const titleId = useId();
	const helpId = useId();
	const [value, setValue] = useState("");
	const [chosen, setChosen] = useState<PinAction | null>(null);
	const [incomplete, setIncomplete] = useState(false);

	const pinLength = scenario.pinLength;
	const actions = pinActions(question.answers);
	const locked = revealed || chosen !== null;
	const isFull = value.length >= pinLength;
	const activeIndex = Math.min(value.length, pinLength - 1);

	const pressDigit = (digit: string) => {
		if (locked || isFull) return;
		setValue((current) => (current.length < pinLength ? current + digit : current));
		setIncomplete(false);
	};

	const deleteDigit = () => {
		if (locked) return;
		setValue((current) => current.slice(0, -1));
		setIncomplete(false);
	};

	const choose = (action: PinAction) => {
		if (locked) return;
		// Confirming needs a complete PIN, like the real screen would.
		if (action === "confirm" && !isFull) {
			setIncomplete(true);
			return;
		}
		setChosen(action);
		onAnswer(actions[action].answer);
	};

	const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
		if (locked || event.altKey || event.ctrlKey || event.metaKey) return;
		const digit = digitFromKey(event);
		if (digit !== null) {
			event.preventDefault();
			pressDigit(digit);
		} else if (event.key === "Backspace") {
			event.preventDefault();
			deleteDigit();
		} else if (event.key === "Enter" && event.target === event.currentTarget && isFull) {
			event.preventDefault();
			choose("confirm");
		}
	};

	return (
		<ScenarioPanel
			revealed={revealed}
			scanKey={scanKey}
			placedFlags={placedFlags}
			label="สถานการณ์จำลอง: หน้าจอขอรหัส PIN"
		>
			<div className="flex flex-col gap-3">
				<div
					role="group"
					aria-labelledby={titleId}
					aria-describedby={helpId}
					tabIndex={locked ? -1 : 0}
					onKeyDown={handleKeyDown}
					className="focus-ring flex flex-col gap-4 rounded-md bg-surface-raised px-4 pt-5 pb-4 text-ink shadow-raised"
				>
					<div className="flex flex-col gap-1 text-center">
						<h2 id={titleId} className="font-display text-lg font-semibold text-ink">
							{scenario.prompt}
						</h2>
						<p id={helpId} className="type-body-sm text-ink-muted">
							ป้อนรหัส PIN {pinLength} หลักเพื่อดำเนินการต่อ
						</p>
					</div>

					<div aria-hidden className="flex justify-center gap-1.5">
						{Array.from({ length: pinLength }, (_, index) => {
							const filled = index < value.length;
							const active = !locked && index === activeIndex && !isFull;
							return (
								<span
									key={index}
									className={cn(
										"relative grid h-12 min-w-0 max-w-12 flex-1 place-items-center rounded-sm border-2 bg-surface-sunken",
										"font-display text-xl text-ink transition-colors duration-(--dur-quick) ease-settle",
										incomplete ? "border-flag" : active ? "border-brand" : "border-line-strong",
									)}
								>
									{filled ? "•" : null}
									{active && <span className="absolute h-6 w-0.5 rounded-pill bg-brand" />}
								</span>
							);
						})}
					</div>
					<p aria-live="polite" className="sr-only">
						กรอกแล้ว {value.length} จาก {pinLength} หลัก
					</p>
					<p
						aria-live="assertive"
						className={cn("-mt-2 text-center type-body-sm text-flag-text", !incomplete && "sr-only")}
					>
						{incomplete ? `กรอกรหัสให้ครบ ${pinLength} หลักก่อนกด${actions.confirm.label}` : ""}
					</p>

					<div className="grid grid-cols-3 gap-2">
						{KEYPAD.map((key, index) => {
							if (key === null) return <span key={index} aria-hidden />;
							if (key === "backspace") {
								return (
									<button
										key={key}
										type="button"
										onClick={deleteDigit}
										disabled={locked}
										aria-disabled={value.length === 0 || undefined}
										aria-label="ลบตัวเลขล่าสุด"
										className={KEY_CLASS}
									>
										<IconBackspace aria-hidden stroke={2} className="size-6" />
									</button>
								);
							}
							return (
								<button
									key={key}
									type="button"
									onClick={() => pressDigit(key)}
									disabled={locked}
									aria-disabled={isFull || undefined}
									className={cn(KEY_CLASS, "font-display text-2xl font-semibold")}
								>
									{key}
								</button>
							);
						})}
					</div>
				</div>

				<div className="flex gap-3">
					{(["cancel", "confirm"] as const).map((action) => (
						<Button
							key={action}
							type="button"
							variant={action === "confirm" ? "brand" : "quiet"}
							size="md"
							block
							disabled={locked}
							aria-pressed={chosen === action}
							onClick={() => choose(action)}
							className={cn(
								"min-w-0 whitespace-normal px-4",
								// Keep the chosen action legible after locking; the other one fades out.
								chosen === action && "disabled:opacity-100",
							)}
						>
							{chosen === action && (
								<StatusIcon kind={actions[action].answer.isCorrect ? "check" : "cross"} animate />
							)}
							{actions[action].label}
						</Button>
					))}
				</div>
			</div>
		</ScenarioPanel>
	);
}
