"use client";

import { motion, useReducedMotion } from "framer-motion";
import { MOTION_PRESETS, withReducedMotion } from "@/lib/motion/presets";

export function SlideIn({
	children,
	className,
	delay = 0,
	direction = "up",
}: {
	children: React.ReactNode;
	className?: string;
	delay?: number;
	direction?: "up" | "left";
}) {
	const prefersReducedMotion = useReducedMotion();
	const preset = direction === "left" ? MOTION_PRESETS.slideLeft : MOTION_PRESETS.slideUp;
	const variants = withReducedMotion(prefersReducedMotion, preset);

	return (
		<motion.div
			className={className}
			variants={variants}
			initial="hidden"
			animate="visible"
			transition={{ duration: prefersReducedMotion ? 0 : 0.35, delay }}
		>
			{children}
		</motion.div>
	);
}
