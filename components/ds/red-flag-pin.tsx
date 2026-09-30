"use client";

import { AnimatePresence, m } from "motion/react";
import { useMemo, type CSSProperties } from "react";
import { StatusIcon } from "@/components/ds/status-icon";
import { fadeUp, flagPlant, pinPulse, staggerChildren } from "@/lib/motion/presets";
import { STAGGER } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

type RedFlag = {
	number: number;
	label: string;
	/** Longer explanation shown under the label in RedFlagList. */
	detail?: string;
};

type PlacedRedFlag = {
	number: number;
	label: string;
	/** Anchor of the pin's centre, in percent of the frame width (0–100). */
	x: number;
	/** Anchor of the pin's centre, in percent of the frame height (0–100). */
	y: number;
};

/*
 * The pin is a fixed 2.5rem wide (w-10), so a placed pin shifts by half of that (1.25rem)
 * to put its centre on the anchor. Callouts leave half a pin + the gap + a small margin
 * (CALLOUT_INSET) to the frame edge.
 */
const CALLOUT_INSET = "2.25rem";

const listStagger = staggerChildren(STAGGER.pins);

/** The loosely typed variant shape of lib/motion/presets.ts (see AGENTS.md). */
type PresetVariants = typeof flagPlant;

/** Pushes a preset's "show" back by `delay` seconds (on top of any delay it already has). */
function delayShow(variants: PresetVariants, delay: number): PresetVariants {
	if (delay <= 0) return variants;
	const transition = variants.show.transition ?? {};
	return {
		...variants,
		show: { ...variants.show, transition: { ...transition, delay: (transition.delay ?? 0) + delay } },
	};
}

/** Flag Plant (Moment 3) for the item at `index`, so pins land STAGGER.pins apart. */
function flagPlantAt(index = 0): PresetVariants {
	return delayShow(flagPlant, index * STAGGER.pins);
}

const clampPercent = (value: number) => Math.min(100, Math.max(0, value));

type FlagBadgeProps = { number: number; className?: string };

/** The red pin itself: flag glyph + number. Decorative; callers give the number in words. */
function FlagBadge({ number, className }: FlagBadgeProps) {
	return (
		<span
			aria-hidden
			className={cn(
				"relative flex h-8 w-10 shrink-0 items-center justify-center gap-0.5 rounded-xs bg-flag text-on-flag shadow-pin",
				className,
			)}
		>
			<StatusIcon kind="flag" className="size-4" />
			<span className="type-label tabular-nums">{number}</span>
		</span>
	);
}

type RedFlagPinProps = {
	number: number;
	label: string;
	/** Percent anchor (0–100) for absolute placement over a ScenarioFrame. Needs `y`. */
	x?: number;
	/** Percent anchor (0–100) for absolute placement over a ScenarioFrame. Needs `x`. */
	y?: number;
	/** Position in the planting order; each step waits STAGGER.pins. */
	index?: number;
	className?: string;
};

/** A numbered red-flag pin with its callout, planted with Flag Plant and one ring pulse. */
function RedFlagPin({ number, label, x, y, index = 0, className }: RedFlagPinProps) {
	const [plant, pulse] = useMemo(
		() => [flagPlantAt(index), delayShow(pinPulse, index * STAGGER.pins)],
		[index],
	);
	const placed = x !== undefined && y !== undefined;
	// Callouts open towards the side with more room, so they stay inside the frame.
	const flip = placed && x > 50;

	const placement = placed ? { left: `${clampPercent(x)}%`, top: `${clampPercent(y)}%` } : undefined;
	const calloutWidth: CSSProperties | undefined = placed
		? {
				maxWidth: `min(14rem, calc(${flip ? clampPercent(x) : 100 - clampPercent(x)}cqw - ${CALLOUT_INSET}))`,
			}
		: undefined;

	return (
		<m.div
			data-slot="ds-red-flag-pin"
			className={cn(
				"flex w-max items-center gap-1.5",
				placed ? "absolute z-10 -translate-y-1/2" : "inline-flex",
				placed &&
					(flip
						? "origin-[calc(100%-1.25rem)_50%] translate-x-[calc(-100%+1.25rem)] flex-row-reverse"
						: "origin-[1.25rem_50%] -translate-x-5"),
				className,
			)}
			style={placement}
			variants={plant}
			initial="hidden"
			animate="show"
			exit="exit"
		>
			<span className="relative shrink-0">
				<m.span
					aria-hidden
					className="absolute inset-0 rounded-xs bg-flag"
					variants={pulse}
				/>
				<FlagBadge number={number} />
			</span>
			<span
				className="max-w-56 rounded-xs bg-flag px-2 py-1 type-body-sm text-on-flag shadow-pin"
				style={calloutWidth}
			>
				<span className="sr-only">ธงแดงที่ {number}: </span>
				{label}
			</span>
		</m.div>
	);
}

type RedFlagLayerProps = {
	flags: readonly PlacedRedFlag[];
	/** Plant the pins (after answering). Keep the layer mounted and flip this. */
	show: boolean;
	className?: string;
};

/** Absolute overlay for a ScenarioFrame: plants every pin in order when `show` turns on. */
function RedFlagLayer({ flags, show, className }: RedFlagLayerProps) {
	return (
		<div
			data-slot="ds-red-flag-layer"
			className={cn("pointer-events-none absolute inset-0 z-20 @container", className)}
		>
			<AnimatePresence>
				{show &&
					flags.map((flag, index) => (
						<RedFlagPin
							key={flag.number}
							number={flag.number}
							label={flag.label}
							x={flag.x}
							y={flag.y}
							index={index}
						/>
					))}
			</AnimatePresence>
		</div>
	);
}

type RedFlagListProps = {
	flags: readonly RedFlag[];
	className?: string;
};

/**
 * Numbered red-flag rows for the Result Sheet. Rows rise in STAGGER.pins apart while each
 * row's pin plants (Flag Plant). Variants are inherited, so the list animates as part of
 * the sheet's stagger and renders static anywhere without an animating parent.
 */
function RedFlagList({ flags, className }: RedFlagListProps) {
	return (
		<m.ol
			data-slot="ds-red-flag-list"
			// Explicit role: Safari drops list semantics when list-style is none.
			role="list"
			aria-label={`ธงแดง ${flags.length} จุด`}
			className={cn("flex flex-col gap-2", className)}
			variants={listStagger}
		>
			{flags.map((flag) => (
				<m.li
					key={flag.number}
					variants={fadeUp}
					className="flex items-start gap-3 rounded-md bg-flag-soft p-3 text-ink"
				>
					<m.span variants={flagPlant} className="shrink-0">
						<FlagBadge number={flag.number} />
					</m.span>
					<div className="min-w-0 flex-1">
						<p className="type-body font-semibold">
							<span className="sr-only">ธงแดงที่ {flag.number}: </span>
							{flag.label}
						</p>
						{flag.detail && <p className="mt-0.5 type-body-sm text-ink-muted">{flag.detail}</p>}
					</div>
				</m.li>
			))}
		</m.ol>
	);
}

export {
	RedFlagPin,
	RedFlagLayer,
	RedFlagList,
	flagPlantAt,
	type RedFlag,
	type PlacedRedFlag,
	type RedFlagPinProps,
	type RedFlagLayerProps,
	type RedFlagListProps,
};
