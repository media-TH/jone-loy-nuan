"use client";

import { m } from "motion/react";
import { StatusIcon } from "@/components/ds/status-icon";
import { railIndicator } from "@/lib/motion/presets";
import { cn } from "@/lib/utils";

type ProgressResult = "correct" | "wrong" | null;

const SEGMENT_FILL: Record<"correct" | "wrong" | "open", string> = {
	correct: "bg-safe",
	wrong: "bg-flag",
	open: "bg-surface-sunken",
};

type ProgressRailProps = {
	total: number;
	/** 0-based index of the question on screen. */
	current: number;
	/** Per-question outcome so far; null (or missing) = not answered yet. */
	results?: readonly ProgressResult[];
	className?: string;
};

/**
 * "ข้อ 3 / 10" + one segment per question; the current-question outline slides along (Moment 6).
 * Segment colour is never the only cue: once something is answered a tally with a word and an
 * icon ("✓ ถูก 2 · ✕ พลาด 1") sits next to the label.
 */
function ProgressRail({ total, current, results = [], className }: ProgressRailProps) {
	const count = Math.max(0, Math.floor(total));
	const index = clampIndex(current, count);
	const number = count === 0 ? 0 : index + 1;

	const answered = results.slice(0, count).filter((result) => result != null).length;
	const correct = results.slice(0, count).filter((result) => result === "correct").length;
	const valueText =
		`ข้อ ${number} จาก ${count}` + (answered > 0 ? `, ตอบถูก ${correct} จาก ${answered} ข้อ` : "");

	return (
		<div
			role="progressbar"
			aria-label="ความคืบหน้าแบบทดสอบ"
			aria-valuemin={count === 0 ? 0 : 1}
			aria-valuemax={count}
			aria-valuenow={number}
			aria-valuetext={valueText}
			data-slot="ds-progress-rail"
			className={cn("flex w-full flex-col gap-1.5", className)}
		>
			<div className="flex items-center justify-between gap-3">
				<span className="type-label tabular-nums text-ink-muted">
					ข้อ {number} / {count}
				</span>
				{answered > 0 ? (
					// Visual twin of aria-valuetext (a progressbar's children are presentational).
					<span aria-hidden className="flex items-center gap-3 type-label tabular-nums">
						<span className="inline-flex items-center gap-1 text-safe">
							<StatusIcon kind="check" className="size-4" />
							ถูก {correct}
						</span>
						<span className="inline-flex items-center gap-1 text-flag-text">
							<StatusIcon kind="cross" className="size-4" />
							พลาด {answered - correct}
						</span>
					</span>
				) : null}
			</div>
			<div className="flex items-center gap-1 py-1">
				{Array.from({ length: count }, (_, i) => (
					<span
						key={i}
						className={cn(
							"relative h-1.5 flex-1 rounded-pill transition-colors duration-(--dur-base) ease-settle",
							SEGMENT_FILL[results[i] ?? "open"],
						)}
					>
						{i === index && (
							<m.span
								layoutId="progress-rail-indicator"
								{...railIndicator}
								className="absolute -inset-1 rounded-pill border-2 border-brand"
							/>
						)}
					</span>
				))}
			</div>
		</div>
	);
}

function clampIndex(current: number, count: number) {
	if (count === 0 || Number.isNaN(current)) return 0;
	return Math.min(count - 1, Math.max(0, Math.floor(current)));
}

export { ProgressRail, type ProgressRailProps, type ProgressResult };
