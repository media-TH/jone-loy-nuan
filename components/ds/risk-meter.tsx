"use client";

import * as React from "react";
import { m, useInView, useReducedMotion, type Transition } from "motion/react";
import { IconAlertTriangle, IconFlag, IconShieldCheck } from "@tabler/icons-react";
import { StatusBadge } from "@/components/ds/status-badge";
import { DUR, EASE } from "@/lib/motion/tokens";
import { RISK_COPY, type RiskLevel } from "@/lib/quiz/risk";
import { cn } from "@/lib/utils";

/**
 * DS RiskMeter — Moment 7 (Score): a half-circle gauge whose needle sweeps from the left
 * end to the level once the meter is on screen. Under reduced motion the needle simply sits
 * at the value. The gauge + badge are one image for assistive tech (single Thai label).
 *
 * Gauge angles run 0° (left, low risk) → 180° (right, high risk).
 */

// Geometry in viewBox units. The viewBox leaves room above/beside the arc for the labels.
const VIEW_W = 240;
const VIEW_H = 150;
const CX = VIEW_W / 2;
const CY = 134;
const R = 88;
const BAND = 22;
const OUTLINE = 2;
const GAP_DEG = 2;
const LABEL_R = R + BAND / 2 + OUTLINE + 13;

const NEEDLE_LENGTH = R - BAND / 2 - 3;
const NEEDLE_TAIL = 14;
const NEEDLE_HALF_WIDTH = 7;
const HUB_R = 11;

const SEGMENTS: ReadonlyArray<{
	level: RiskLevel;
	from: number;
	to: number;
	strokeClass: string;
	word: string;
}> = [
	{ level: "low", from: 0, to: 60, strokeClass: "stroke-safe", word: "ต่ำ" },
	{ level: "medium", from: 60, to: 120, strokeClass: "stroke-caution", word: "ปานกลาง" },
	{ level: "high", from: 120, to: 180, strokeClass: "stroke-flag", word: "สูง" },
];

const LEVEL_ANGLE: Record<RiskLevel, number> = { low: 30, medium: 90, high: 150 };

const LEVEL_ICON: Record<RiskLevel, React.ReactNode> = {
	low: <IconShieldCheck stroke={2.25} />,
	medium: <IconAlertTriangle stroke={2.25} />,
	high: <IconFlag stroke={2.25} />,
};

function pointAt(deg: number, radius: number) {
	const rad = (deg * Math.PI) / 180;
	return { x: CX - radius * Math.cos(rad), y: CY - radius * Math.sin(rad) };
}

/** Clockwise arc (left → top → right) between two gauge angles. */
function arcPath(fromDeg: number, toDeg: number, radius: number) {
	const start = pointAt(fromDeg, radius);
	const end = pointAt(toDeg, radius);
	const f = (n: number) => n.toFixed(2);
	return `M ${f(start.x)} ${f(start.y)} A ${radius} ${radius} 0 0 1 ${f(end.x)} ${f(end.y)}`;
}

/** Degrees the outline must extend past each end to cover the band's butt caps. */
const OUTLINE_EXTEND_DEG = (OUTLINE / R) * (180 / Math.PI);
const OUTLINE_PATH = arcPath(-OUTLINE_EXTEND_DEG, 180 + OUTLINE_EXTEND_DEG, R);

/** Needle drawn pointing at 0° (left); rotating it by the gauge angle aims it at the level. */
const NEEDLE_PATH = [
	`M ${CX - NEEDLE_LENGTH} ${CY}`,
	`L ${CX} ${CY - NEEDLE_HALF_WIDTH}`,
	`L ${CX + NEEDLE_TAIL} ${CY}`,
	`L ${CX} ${CY + NEEDLE_HALF_WIDTH}`,
	"Z",
].join(" ");

/**
 * motion rotates SVG around the element's own fill-box, so place the origin on the hub:
 * the needle's box spans [CX - length, CX + tail] horizontally and is centred vertically.
 */
const NEEDLE_ORIGIN_X = NEEDLE_LENGTH / (NEEDLE_LENGTH + NEEDLE_TAIL);

type RiskMeterProps = {
	level: RiskLevel;
	className?: string;
};

function RiskMeter({ level, className }: RiskMeterProps) {
	const ref = React.useRef<HTMLDivElement>(null);
	const inView = useInView(ref, { once: true, amount: 0.5 });
	const prefersReducedMotion = useReducedMotion();
	const copy = RISK_COPY[level];
	const angle = inView || prefersReducedMotion ? LEVEL_ANGLE[level] : 0;

	const needleTransition: Transition = prefersReducedMotion
		? { duration: 0 }
		: { duration: DUR.slow * 2, ease: EASE.settle };

	return (
		<div
			ref={ref}
			role="img"
			aria-label={`มาตรวัดความเสี่ยง: ${copy.label}`}
			data-slot="ds-risk-meter"
			data-level={level}
			className={cn("flex w-full max-w-72 flex-col items-center gap-3", className)}
		>
			<svg
				viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
				className="h-auto w-full overflow-visible"
				aria-hidden
				focusable="false"
			>
				{/* Ink outline behind the bands; the gaps between bands read as ink separators. */}
				<path
					d={OUTLINE_PATH}
					fill="none"
					className="stroke-ink"
					strokeWidth={BAND + OUTLINE * 2}
				/>
				{SEGMENTS.map((segment) => {
					const from = segment.from === 0 ? 0 : segment.from + GAP_DEG / 2;
					const to = segment.to === 180 ? 180 : segment.to - GAP_DEG / 2;
					return (
						<path
							key={segment.level}
							d={arcPath(from, to, R)}
							fill="none"
							className={segment.strokeClass}
							strokeWidth={BAND}
						/>
					);
				})}
				{SEGMENTS.map((segment) => {
					const { x, y } = pointAt((segment.from + segment.to) / 2, LABEL_R);
					const active = segment.level === level;
					return (
						<text
							key={segment.level}
							x={x}
							y={y}
							textAnchor="middle"
							dominantBaseline="central"
							className={cn("type-label", active ? "fill-ink" : "fill-ink-muted")}
						>
							{segment.word}
						</text>
					);
				})}
				<m.g
					initial={{ rotate: 0 }}
					animate={{ rotate: angle }}
					transition={needleTransition}
					style={{ originX: NEEDLE_ORIGIN_X, originY: 0.5 }}
				>
					<path
						d={NEEDLE_PATH}
						className="fill-ink stroke-ink"
						strokeWidth={2}
						strokeLinejoin="round"
					/>
				</m.g>
				<circle cx={CX} cy={CY} r={HUB_R} className="fill-ink" />
				<circle cx={CX} cy={CY} r={4} className="fill-surface-raised" />
			</svg>
			<StatusBadge tone={copy.tone} icon={LEVEL_ICON[level]}>
				{copy.label}
			</StatusBadge>
		</div>
	);
}

export { RiskMeter, type RiskMeterProps };
