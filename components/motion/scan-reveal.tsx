"use client";

/**
 * Moment 2 — Scan Reveal: one pass of the lens band over a scenario when it appears.
 * Decorative only: the content underneath is fully visible at rest. Change `scanKey` to replay
 * the pass.
 *
 * Reduced motion hides the band with CSS (`motion-reduce:hidden`) instead of not rendering it:
 * useReducedMotion() is null on the server but already true on the client's first render, so a
 * conditional band would make the server HTML and the hydrating render disagree.
 */

import { m } from "motion/react";
import type { ReactNode } from "react";
import { scanSweep } from "@/lib/motion/presets";
import { cn } from "@/lib/utils";

type ScanRevealProps = {
	children: ReactNode;
	scanKey?: string | number;
	className?: string;
};

export function ScanReveal({ children, scanKey, className }: ScanRevealProps) {
	return (
		<div className={cn("relative isolate overflow-hidden", className)}>
			{children}
			<div aria-hidden className="pointer-events-none absolute inset-0 z-10 motion-reduce:hidden">
				<m.div key={scanKey} className="absolute inset-0" {...scanSweep}>
					<div className="absolute inset-x-0 bottom-0 h-12 border-b-2 border-brand bg-scan-band" />
				</m.div>
			</div>
		</div>
	);
}
