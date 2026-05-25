"use client";

import { motion, useReducedMotion } from "framer-motion";
import { MOTION_PRESETS, withReducedMotion } from "@/lib/motion/presets";

export function FadeIn({
	children,
	className,
	delay = 0,
	as = "div",
}: {
	children: React.ReactNode;
	className?: string;
	delay?: number;
	as?: keyof typeof motion;
}) {
	const prefersReducedMotion = useReducedMotion();
	const variants = withReducedMotion(prefersReducedMotion, MOTION_PRESETS.fadeIn);
	const MotionTag = motion[as] as Record<string, unknown>;

	return (
		<MotionTag
			className={className}
			variants={variants}
			initial="hidden"
			animate="visible"
			transition={{ duration: prefersReducedMotion ? 0 : 0.3, delay }}
		>
			{children}
		</MotionTag>
	);
}
