import { useMemo } from "react";
import type { Variants } from "framer-motion";

/**
 * Custom hook for PIN scenario animations
 * Handles red flag pin, note, and overlay animations
 */
export function usePinScenarioAnimations(answered: boolean) {
	const redFlagVariants: Variants = useMemo(
		() => ({
			hidden: {
				scale: 0,
				rotate: -10,
				opacity: 0,
			},
			visible: {
				scale: 1,
				rotate: 0,
				opacity: 1,
				transition: {
					delay: 0.2,
					type: "spring",
					stiffness: 200,
					damping: 15,
				},
			},
		}),
		[]
	);

	const noteVariants: Variants = useMemo(
		() => ({
			hidden: {
				opacity: 0,
				y: 10,
			},
			visible: {
				opacity: 1,
				y: 0,
				transition: {
					delay: 0.4,
					duration: 0.3,
					ease: "easeOut",
				},
			},
		}),
		[]
	);

	const overlayVariants: Variants = useMemo(
		() => ({
			hidden: {
				opacity: 0,
			},
			visible: {
				opacity: 0.7,
				transition: {
					duration: 0.5,
					ease: "easeInOut",
				},
			},
		}),
		[]
	);

	const containerVariants: Variants = useMemo(
		() => ({
			initial: {
				y: 20,
				opacity: 0,
			},
			animate: {
				y: 0,
				opacity: 1,
				transition: {
					duration: 0.4,
					ease: "easeOut",
				},
			},
		}),
		[]
	);

	const buttonsVariants: Variants = useMemo(
		() => ({
			initial: {
				y: 20,
				opacity: 0,
			},
			animate: {
				y: 0,
				opacity: 1,
				transition: {
					delay: 0.1,
					duration: 0.4,
					ease: "easeOut",
				},
			},
		}),
		[]
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