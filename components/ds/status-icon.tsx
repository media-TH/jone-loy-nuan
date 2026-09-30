"use client";

import { m, useReducedMotion } from "motion/react";
import { iconDraw } from "@/lib/motion/presets";
import { DUR } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

type StatusIconKind = "check" | "cross" | "flag" | "alert";

type StatusIconProps = {
	kind: StatusIconKind;
	/** Draw the stroke in (check / cross only). Skipped under reduced motion. */
	animate?: boolean;
	className?: string;
	/** Accessible name. Without it the icon is decorative (aria-hidden). */
	title?: string;
};

/*
 * Path data from Tabler Icons (MIT): the same glyphs as @tabler/icons-react, redrawn
 * inline so each stroke can animate its pathLength.
 */
const PATHS: Record<StatusIconKind, readonly string[]> = {
	check: ["M5 12l5 5l10 -10"],
	cross: ["M18 6l-12 12", "M6 6l12 12"],
	flag: ["M5 5a5 5 0 0 1 7 0a5 5 0 0 0 7 0v9a5 5 0 0 1 -7 0a5 5 0 0 0 -7 0v-9z", "M5 21v-7"],
	alert: [
		"M12 9v4",
		"M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0z",
		"M12 16h.01",
	],
};

const DRAWABLE: ReadonlySet<StatusIconKind> = new Set(["check", "cross"]);

// The cross's second stroke starts a beat after the first, like a hand-drawn ✕.
const STROKE_VARIANTS = [
	iconDraw,
	{
		...iconDraw,
		show: {
			...iconDraw.show,
			transition: { ...iconDraw.show.transition, delay: DUR.instant },
		},
	},
];

/** 24px status glyph (✓ ✕ ⚑ !) in currentColor; check and cross can draw themselves in. */
function StatusIcon({ kind, animate = false, className, title }: StatusIconProps) {
	const prefersReducedMotion = useReducedMotion();
	const draw = animate && !prefersReducedMotion && DRAWABLE.has(kind);

	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			width={24}
			height={24}
			fill="none"
			stroke="currentColor"
			strokeWidth={2.25}
			strokeLinecap="round"
			strokeLinejoin="round"
			focusable="false"
			role={title ? "img" : undefined}
			aria-hidden={title ? undefined : true}
			data-slot="ds-status-icon"
			data-kind={kind}
			className={cn("size-6 shrink-0", className)}
		>
			{title && <title>{title}</title>}
			{PATHS[kind].map((d, index) =>
				draw ? (
					<m.path
						key={d}
						d={d}
						variants={STROKE_VARIANTS[index] ?? iconDraw}
						initial="hidden"
						animate="show"
					/>
				) : (
					<path key={d} d={d} />
				),
			)}
		</svg>
	);
}

export { StatusIcon, type StatusIconKind, type StatusIconProps };
