import { useMemo, useCallback } from "react";
import { useReducedMotion } from "framer-motion";
import type { Variants } from "framer-motion";
import {
	QUIZ_MOTION_TOKENS,
	reduceMotionSpring,
	reduceMotionTransition,
} from "@/lib/motion/quiz-motion";

/**
 * Custom hook for PIN scenario animations
 * Handles red flag pin, note, and overlay animations
 */
export function usePinScenarioAnimations(answered: boolean) {
	const prefersReducedMotion = useReducedMotion();
	const tokens = QUIZ_MOTION_TOKENS;

	const withTransition = useCallback(
		(transition: Record<string, unknown>) =>
			reduceMotionTransition(prefersReducedMotion ?? false, transition),
		[prefersReducedMotion]
	);

	const withSpring = useCallback(
		(transition: Record<string, unknown>) =>
			reduceMotionSpring(prefersReducedMotion ?? false, transition),
		[prefersReducedMotion]
	);

	const redFlagVariants: Variants = useMemo(
		() => ({
			hidden: {
				scale: tokens.scale.zero,
				rotate: -10,
				opacity: 0,
			},
			visible: {
				scale: 1,
				rotate: 0,
				opacity: 1,
				transition: withSpring({
					delay: tokens.delays.base,
					...tokens.spring.redFlag,
				}),
			},
		}),
		[withSpring, tokens]
	);

	const noteVariants: Variants = useMemo(
		() => ({
			hidden: {
				opacity: 0,
				y: tokens.distances.yTiny,
			},
			visible: {
				opacity: 1,
				y: 0,
				transition: withTransition({
					delay: tokens.delays.cta,
					duration: tokens.durations.fast,
					ease: tokens.easing.out,
				}),
			},
		}),
		[withTransition, tokens]
	);

	const overlayVariants: Variants = useMemo(
		() => ({
			hidden: {
				opacity: 0,
			},
			visible: {
				opacity: 0.7,
				transition: withTransition({
					duration: tokens.durations.medium,
					ease: tokens.easing.inOut,
				}),
			},
		}),
		[withTransition, tokens]
	);

	const containerVariants: Variants = useMemo(
		() => ({
			initial: {
				y: tokens.distances.ySmall,
				opacity: 0,
			},
			animate: {
				y: 0,
				opacity: 1,
				transition: withTransition({
					duration: tokens.durations.base,
					ease: tokens.easing.out,
				}),
			},
		}),
		[withTransition, tokens]
	);

	const buttonsVariants: Variants = useMemo(
		() => ({
			initial: {
				y: tokens.distances.ySmall,
				opacity: 0,
			},
			animate: {
				y: 0,
				opacity: 1,
				transition: withTransition({
					delay: tokens.delays.step,
					duration: tokens.durations.base,
					ease: tokens.easing.out,
				}),
			},
		}),
		[withTransition, tokens]
	);

	return {
		redFlagVariants,
		noteVariants,
		overlayVariants,
		containerVariants,
		buttonsVariants,
		// Animation states
		showRedFlag: answered,
		showNote: answered,
		showOverlay: answered,
	};
}
