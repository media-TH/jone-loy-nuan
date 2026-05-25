"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { MOTION_PRESETS } from "@/lib/motion/presets";

export function PageTransition({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	const prefersReducedMotion = useReducedMotion();

	return (
		<AnimatePresence mode="wait" initial={false}>
			<motion.div
				key={pathname}
				initial={MOTION_PRESETS.page.initial}
				animate={MOTION_PRESETS.page.animate}
				exit={MOTION_PRESETS.page.exit}
				transition={
					prefersReducedMotion
						? { duration: 0 }
						: (MOTION_PRESETS.page.transition as Record<string, unknown>)
				}
			>
				{children}
			</motion.div>
		</AnimatePresence>
	);
}
