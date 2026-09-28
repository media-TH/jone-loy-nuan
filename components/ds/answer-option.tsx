"use client";

import { m } from "motion/react";
import type { ReactNode } from "react";
import { cva } from "class-variance-authority";
import { StatusIcon } from "@/components/ds/status-icon";
import { pressable, wrongNudge } from "@/lib/motion/presets";
import { cn } from "@/lib/utils";

type AnswerOptionState = "idle" | "correct" | "wrong" | "dimmed";

/**
 * Answer feedback (Moment 4). Colour changes are CSS transitions; the press scale and
 * the wrong-answer nudge are transforms, so reduced motion leaves only the colour change.
 */
const answerOptionVariants = cva(
	[
		"relative flex min-h-14 w-full select-none items-center gap-3 rounded-md border-2 px-4 py-3 text-left",
		"type-body-lg focus-ring",
		"transition-[background-color,border-color,color,opacity] duration-(--dur-base) ease-settle",
	],
	{
		variants: {
			state: {
				idle: "border-line-strong bg-surface-raised text-ink",
				correct: "border-safe bg-safe text-on-safe",
				wrong: "border-flag bg-flag text-on-flag",
				dimmed: "border-line bg-surface-raised text-ink-muted opacity-70",
			},
			locked: {
				true: "cursor-default",
				false: "cursor-pointer",
			},
		},
		compoundVariants: [{ state: "idle", locked: false, className: "hover:bg-brand-soft" }],
		defaultVariants: {
			state: "idle",
			locked: false,
		},
	},
);

const letterVariants = cva(
	[
		"grid size-9 shrink-0 place-items-center rounded-pill border-2 font-display text-base font-semibold leading-none",
		"transition-[background-color,border-color,color] duration-(--dur-base) ease-settle",
	],
	{
		variants: {
			state: {
				idle: "border-line-strong text-ink",
				correct: "border-transparent bg-on-safe text-safe",
				wrong: "border-transparent bg-on-flag text-flag",
				dimmed: "border-line text-ink-muted",
			},
		},
		defaultVariants: {
			state: "idle",
		},
	},
);

const STATUS = {
	correct: { kind: "check", word: "ถูกต้อง" },
	wrong: { kind: "cross", word: "ไม่ใช่" },
} as const;

const AT_REST = { x: 0 };

type AnswerOptionProps = {
	/** Thai choice letter shown in the badge: ก ข ค ง. */
	letter: string;
	state?: AnswerOptionState;
	onSelect: () => void;
	/** Blocks selection (kept focusable via aria-disabled). Defaults to true once the state is not idle. */
	disabled?: boolean;
	/** The option the player chose; exposed as aria-pressed. */
	selected?: boolean;
	className?: string;
	children: ReactNode;
};

/** One tappable answer: letter badge + text; after answering shows ✓ ถูกต้อง / ✕ ไม่ใช่ in words, not colour alone. */
function AnswerOption({
	letter,
	state = "idle",
	onSelect,
	disabled,
	selected = false,
	className,
	children,
}: AnswerOptionProps) {
	const locked = disabled ?? state !== "idle";
	const status = state === "correct" || state === "wrong" ? STATUS[state] : null;

	return (
		<m.button
			type="button"
			data-slot="ds-answer-option"
			data-state={state}
			aria-pressed={selected}
			aria-disabled={locked || undefined}
			onClick={() => {
				if (!locked) onSelect();
			}}
			className={cn(answerOptionVariants({ state, locked }), className)}
			whileTap={locked ? undefined : pressable.whileTap}
			transition={pressable.transition}
			animate={state === "wrong" ? wrongNudge : AT_REST}
		>
			<span className={letterVariants({ state })}>{letter}</span>
			<span className="min-w-0 flex-1 break-words">{children}</span>
			{status && (
				<span className="flex shrink-0 items-center gap-1 type-label">
					<StatusIcon kind={status.kind} animate className="size-5" />
					{status.word}
				</span>
			)}
		</m.button>
	);
}

export { AnswerOption, answerOptionVariants, type AnswerOptionProps, type AnswerOptionState };
