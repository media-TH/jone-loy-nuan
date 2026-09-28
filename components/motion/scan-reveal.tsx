"use client";

/**
 * Moment 2 — Scan Reveal: one pass of the lens band over a scenario when it appears.
 * Decorative only: the content underneath is fully visible at rest, and the band is not
 * rendered at all under reduced motion. Change `scanKey` to replay the pass.
 */

import { m, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { scanSweep } from "@/lib/motion/presets";
import { cn } from "@/lib/utils";

type ScanRevealProps = {
	children: ReactNode;
	scanKey?: string | number;
	className?: string;
};

export function ScanReveal({ children, scanKey, className }: ScanRevealProps) {
	const prefersReducedMotion = useReducedMotion();

	return (
		<div className={cn("relative isolate overflow-hidden", className)}>
			{children}
			{!prefersReducedMotion && (
				<div aria-hidden className="pointer-events-none absolute inset-0 z-10">
					<m.div key={scanKey} className="absolute inset-0" {...scanSweep}>
						<div className="absolute inset-x-0 bottom-0 h-12 border-b-2 border-brand bg-scan-band" />
					</m.div>
				</div>
			)}
		</div>
	);
}
