"use client";

import { useEffect } from "react";
import { AnswerOption, type AnswerOptionState } from "@/components/ds/answer-option";
import type { QuizAnswer } from "@/components/quiz/types";
import type { Answer } from "@/lib/content/types";
import { cn } from "@/lib/utils";

/** Thai choice letters, in exam order. */
const CHOICE_LETTERS = ["ก", "ข", "ค", "ง", "จ", "ฉ"] as const;

function choiceLetter(index: number): string {
	return CHOICE_LETTERS[index] ?? String(index + 1);
}

function optionState(answer: Answer, response: QuizAnswer | null): AnswerOptionState {
	if (!response) return "idle";
	if (answer.id === response.answerId) return answer.isCorrect ? "correct" : "wrong";
	// After a wrong pick the right answer is shown too, so the player learns it.
	return answer.isCorrect ? "correct" : "dimmed";
}

function isEditable(target: EventTarget | null): boolean {
	return (
		target instanceof HTMLElement &&
		(target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
	);
}

/** 1–9 on the number row or keypad, on any layout (Thai Kedmanee included); 0-based. */
function choiceFromKey(event: KeyboardEvent): number | null {
	const digit = /^(?:Digit|Numpad)([1-9])$/.exec(event.code)?.[1] ?? /^[1-9]$/.exec(event.key)?.[0];
	return digit ? Number(digit) - 1 : null;
}

type AnswerListProps = {
	answers: readonly Answer[];
	/** The answer given, or null while choosing. */
	response: QuizAnswer | null;
	onSelect: (answerId: string) => void;
	/** Id of the question heading that labels the group. */
	labelledBy: string;
};

/**
 * The question's choices as AnswerOptions lettered ก ข ค ง. Number keys 1–4 pick a choice while
 * the question is open; two choices sit side by side from 360px up.
 */
export function AnswerList({ answers, response, onSelect, labelledBy }: AnswerListProps) {
	const answered = response !== null;
	const sideBySide = answers.length === 2;

	useEffect(() => {
		if (answered) return;
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.defaultPrevented || event.repeat || event.altKey || event.ctrlKey || event.metaKey) {
				return;
			}
			if (isEditable(event.target)) return;
			const index = choiceFromKey(event);
			const answer = index === null ? undefined : answers[index];
			if (!answer) return;
			event.preventDefault();
			onSelect(answer.id);
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [answered, answers, onSelect]);

	return (
		<div className="flex flex-col gap-2">
			<div
				role="group"
				aria-labelledby={labelledBy}
				className={cn("grid gap-3", sideBySide && "min-[360px]:grid-cols-2")}
			>
				{answers.map((answer, index) => (
					<AnswerOption
						key={answer.id}
						letter={choiceLetter(index)}
						state={optionState(answer, response)}
						selected={answer.id === response?.answerId}
						onSelect={() => onSelect(answer.id)}
						// Side by side, each choice is a tile: letter, text, then the verdict word.
						className={cn(sideBySide && "min-[360px]:flex-col min-[360px]:items-start")}
					>
						{answer.text}
					</AnswerOption>
				))}
			</div>
			{!answered && answers.length > 1 && (
				<p
					aria-hidden
					className="hidden text-center type-body-sm text-ink-muted [@media(hover:hover)_and_(pointer:fine)]:block"
				>
					กดปุ่ม 1–{Math.min(answers.length, 9)} บนแป้นพิมพ์เพื่อเลือกคำตอบได้
				</p>
			)}
		</div>
	);
}
