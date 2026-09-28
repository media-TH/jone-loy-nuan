"use client";

import { m } from "motion/react";
import { Fragment, useMemo } from "react";
import { flagPlantAt } from "@/components/ds/red-flag-pin";
import { cn } from "@/lib/utils";

type EvidenceHighlight = {
	/** UTF-16 offset, inclusive (same indexing as String.prototype.slice). */
	start: number;
	/** UTF-16 offset, exclusive. */
	end: number;
	/** Red-flag number shown in the chip. */
	flag: number;
};

type EvidenceSegment = {
	text: string;
	start: number;
	end: number;
	/** Present only on highlighted segments. */
	flag?: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * Splits `text` into plain and highlighted segments that cover it exactly once, in order.
 * Offsets are truncated to integers and clamped into the string; empty, reversed and NaN
 * ranges are dropped. Overlaps resolve first-come: ranges are sorted by start (longer
 * first on ties) and a later range only keeps the part after the previous one ends.
 */
function splitEvidence(
	text: string,
	highlights: readonly EvidenceHighlight[] = [],
): EvidenceSegment[] {
	const length = text.length;
	if (length === 0) return [];

	const ranges = highlights
		.filter((range) => !Number.isNaN(range.start) && !Number.isNaN(range.end))
		.map((range) => ({
			start: clamp(Math.trunc(range.start), 0, length),
			end: clamp(Math.trunc(range.end), 0, length),
			flag: range.flag,
		}))
		.filter((range) => range.end > range.start)
		.sort((a, b) => a.start - b.start || b.end - a.end);

	const segments: EvidenceSegment[] = [];
	let cursor = 0;
	for (const range of ranges) {
		const start = Math.max(range.start, cursor);
		// Fully inside an earlier highlight.
		if (range.end <= start) continue;
		if (start > cursor) {
			segments.push({ text: text.slice(cursor, start), start: cursor, end: start });
		}
		segments.push({ text: text.slice(start, range.end), start, end: range.end, flag: range.flag });
		cursor = range.end;
	}
	if (cursor < length) {
		segments.push({ text: text.slice(cursor), start: cursor, end: length });
	}
	return segments;
}

type EvidenceTextProps = {
	/** The suspicious string: phone number, URL, sender id, account number, OTP… */
	text: string;
	highlights?: readonly EvidenceHighlight[];
	/** Show the flags. Keep false until the player has answered: nothing hints before. */
	revealed?: boolean;
	as?: "span" | "p" | "div";
	className?: string;
};

/** Evidence in mono, read character by character; once revealed, flagged parts get a flag underline + pin number. */
function EvidenceText({
	text,
	highlights,
	revealed = false,
	as: Tag = "span",
	className,
}: EvidenceTextProps) {
	const segments = useMemo(() => {
		const split = splitEvidence(text, highlights);
		const flagged = split.filter((segment) => segment.flag !== undefined);
		return split.map((segment) => ({
			...segment,
			// Chips plant in reading order, STAGGER.pins apart.
			plant: segment.flag === undefined ? undefined : flagPlantAt(flagged.indexOf(segment)),
		}));
	}, [text, highlights]);

	return (
		<Tag
			data-slot="ds-evidence-text"
			data-revealed={revealed || undefined}
			className={cn("type-evidence break-words", className)}
		>
			{segments.map((segment) =>
				revealed && segment.flag !== undefined ? (
					<mark
						key={segment.start}
						className="bg-transparent text-inherit underline decoration-flag decoration-2 underline-offset-4"
					>
						{segment.text}
						<span className="sr-only"> (ธงแดงที่ {segment.flag})</span>
						<m.span
							aria-hidden
							variants={segment.plant}
							initial="hidden"
							animate="show"
							className="relative -top-2 ml-0.5 inline-block rounded-xs bg-flag px-1 py-px type-label leading-none tabular-nums text-on-flag"
						>
							{segment.flag}
						</m.span>
					</mark>
				) : (
					<Fragment key={segment.start}>{segment.text}</Fragment>
				),
			)}
		</Tag>
	);
}

export {
	EvidenceText,
	splitEvidence,
	type EvidenceHighlight,
	type EvidenceSegment,
	type EvidenceTextProps,
};
