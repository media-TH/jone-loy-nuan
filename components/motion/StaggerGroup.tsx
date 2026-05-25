"use client";

import { motion, useReducedMotion } from "framer-motion";
import { MOTION_PRESETS, withReducedMotion } from "@/lib/motion/presets";

export function StaggerGroup({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	const prefersReducedMotion = useReducedMotion();
	const variants = withReducedMotion(prefersReducedMotion, MOTION_PRESETS.stagger);

	return (
		<motion.div className={className} variants={variants} initial="hidden" animate="visible">
			{children}
		</motion.div>
	);
}
