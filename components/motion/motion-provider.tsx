"use client";

import { LazyMotion, MotionConfig, domMax } from "motion/react";
import type { ReactNode } from "react";

/**
 * App-wide motion setup.
 * - LazyMotion + domMax: new code renders `m.*` components, which ship without the
 *   full feature bundle; domMax is needed for layoutId (Progress Rail).
 * - reducedMotion="user": when the OS asks for reduced motion, transform and layout
 *   animations are skipped while opacity/colour still change. Every preset in
 *   lib/motion/presets.ts is designed to degrade to that.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
	return (
		<LazyMotion features={domMax}>
			<MotionConfig reducedMotion="user">{children}</MotionConfig>
		</LazyMotion>
	);
}
