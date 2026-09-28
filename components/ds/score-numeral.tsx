"use client";

import * as React from "react";
import {
	animate,
	m,
	useMotionValue,
	useReducedMotion,
	useTransform,
	type ValueAnimationTransition,
} from "motion/react";
import { DUR, EASE } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

/**
 * DS ScoreNumeral — Moment 7 (Score): the score counts up 0 → value over 800ms (ease-settle).
 * Reduced motion jumps straight to the value. The ticking digits are hidden from assistive
 * tech; a visually-hidden polite live region announces the final score once it lands.
 */
type ScoreNumeralProps = {
	value: number;
	total: number;
	className?: string;
};

function ScoreNumeral({ value, total, className }: ScoreNumeralProps) {
	const prefersReducedMotion = useReducedMotion();
	const count = useMotionValue(0);
	const shown = useTransform(count, (latest) => Math.round(latest));
	const [announcement, setAnnouncement] = React.useState("");

	const finalText = `คะแนนของคุณ ${value} จาก ${total}`;
	// Reserve the final width so the "/total" part doesn't shift while digits grow.
	const digits = String(Math.max(0, Math.round(value))).length;

	React.useEffect(() => {
		let active = true;
		const transition: ValueAnimationTransition<number> = prefersReducedMotion
			? { duration: 0 }
			: { duration: DUR.slow * 2, ease: EASE.settle };
		const controls = animate(count, value, {
			...transition,
			onComplete: () => {
				if (active) setAnnouncement(finalText);
			},
		});
		return () => {
			active = false;
			controls.stop();
		};
	}, [count, value, finalText, prefersReducedMotion]);

	return (
		<p
			data-slot="ds-score-numeral"
			className={cn("type-numeral inline-flex items-baseline text-ink tabular-nums", className)}
		>
			<span aria-hidden className="inline-flex items-baseline">
				<m.span className="inline-block text-right" style={{ minWidth: `${digits}ch` }}>
					{shown}
				</m.span>
				<span className="text-ink-muted">/{total}</span>
			</span>
			<span className="sr-only" aria-live="polite" aria-atomic="true">
				{announcement}
			</span>
		</p>
	);
}

export { ScoreNumeral, type ScoreNumeralProps };
