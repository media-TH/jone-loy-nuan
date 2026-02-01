"use client";

import {
	useMemo,
	useEffect,
	useState,
	useCallback,
	useSyncExternalStore,
} from "react";
import { useReducedMotion } from "framer-motion";
import type { AnswerPanelLayout } from "@/lib/types";
import {
	QUIZ_MOTION_TOKENS,
	reduceMotionSpring,
	reduceMotionTransition,
} from "@/lib/motion/quiz-motion";

type ScreenSize = { width: number };

const screenSizeStore = (() => {
	let size: ScreenSize = {
		width: typeof window === "undefined" ? 1024 : window.innerWidth,
	};
	let frame: number | null = null;
	const listeners = new Set<() => void>();

	const notify = () => {
		for (const listener of listeners) {
			listener();
		}
	};

	const onResize = () => {
		if (frame !== null || typeof window === "undefined") return;

		frame = window.requestAnimationFrame(() => {
			frame = null;
			const nextWidth = window.innerWidth;
			if (nextWidth === size.width) return;
			size = { width: nextWidth };
			notify();
		});
	};

	const subscribe = (listener: () => void) => {
		listeners.add(listener);
		if (listeners.size === 1 && typeof window !== "undefined") {
			window.addEventListener("resize", onResize, { passive: true });
		}

		return () => {
			listeners.delete(listener);
			if (listeners.size === 0 && typeof window !== "undefined") {
				if (frame !== null) {
					window.cancelAnimationFrame(frame);
					frame = null;
				}
				window.removeEventListener("resize", onResize);
			}
		};
	};

	const getSnapshot = () => size;
	const getServerSnapshot = () => ({ width: 1024 });

	return { subscribe, getSnapshot, getServerSnapshot };
})();

/**
 * Optimized hook for screen size detection (single listener)
 */
function useScreenSize() {
	return useSyncExternalStore(
		screenSizeStore.subscribe,
		screenSizeStore.getSnapshot,
		screenSizeStore.getServerSnapshot
	);
}

/**
 * 🎨 Animation Logic - Fixed infinite loop issues
 */
export const useQuizAnimations = (showResult: boolean) => {
	const { width } = useScreenSize();
	const prefersReducedMotion = useReducedMotion();
	const [isInitialized, setIsInitialized] = useState(false);
	const tokens = QUIZ_MOTION_TOKENS;

	const withTransition = useCallback(
		(transition: Record<string, unknown>) =>
			reduceMotionTransition(prefersReducedMotion, transition),
		[prefersReducedMotion]
	);

	const withSpring = useCallback(
		(transition: Record<string, unknown>) =>
			reduceMotionSpring(prefersReducedMotion, transition),
		[prefersReducedMotion]
	);

	useEffect(() => {
		const timer = setTimeout(() => {
			setIsInitialized(true);
		}, 500);

		return () => clearTimeout(timer);
	}, []);

	// ✅ FIXED: Memoize responsive values with proper dependencies
	const responsiveValues = useMemo(() => {
		const isMobile = width < 640;
		const isTablet = width >= 640 && width < 1024;
		const isDesktop = width >= 1024;

		return {
			yMove: isMobile
				? -tokens.distances.quizLiftMobile
				: -tokens.distances.quizLiftDesktop,
			scaleDown: tokens.scale.down,
			answerPanelMove: isMobile
				? -tokens.distances.yTiny
				: isTablet
					? -tokens.distances.yMicro
					: -tokens.distances.ySmall,
			questionExitY: isMobile
				? -tokens.distances.ySmall
				: isTablet
					? -tokens.distances.yMedium
					: -tokens.distances.yLarge / 2,
			bubbleY: isMobile ? tokens.distances.yMicro : tokens.distances.ySmall,
			bubbleScale: isMobile ? tokens.scale.bubbleMobile : tokens.scale.bubbleDesktop,
			buttonY: isMobile ? tokens.distances.yMicro : tokens.distances.ySmall,
			isMobile,
			isTablet,
			isDesktop,
		};
	}, [width, tokens]); // Only depend on primitive values

	const getContentMotionProps = useCallback(() => {
		return {
			initial: { opacity: 1, y: 0, scale: 1 },
			animate: showResult
				? {
						y: responsiveValues.yMove,
						scale: responsiveValues.scaleDown,
						opacity: 1,
				  }
				: { y: 0, scale: 1, opacity: 1 },
			transition: {
				...withTransition({
					duration: tokens.durations.long,
					ease: tokens.easing.inOut,
					delay: showResult ? tokens.delays.base : 0,
				}),
			},
		};
	}, [
		showResult,
		responsiveValues.yMove,
		responsiveValues.scaleDown,
		withTransition,
		tokens,
	]);

	const getChatScenarioMotionProps = useCallback(() => {
		return {
			initial: { opacity: 1, y: 0, scale: 1 },
			animate: showResult
				? { y: responsiveValues.yMove, scale: 1, opacity: 1.0 }
				: { y: 0, scale: 1, opacity: 1 },
			transition: {
				...withTransition({
					duration: tokens.durations.long,
					ease: tokens.easing.inOut,
					delay: showResult ? tokens.delays.base : 0,
				}),
			},
		};
	}, [showResult, responsiveValues.yMove, withTransition, tokens]);

	const getChatBubbleAnimation = useCallback(() => {
		return {
			initial: {
				opacity: 0,
				scale: responsiveValues.bubbleScale,
				y: responsiveValues.bubbleY,
			},
			animate: {
				opacity: 1,
				scale: 1,
				y: 0,
			},
			transition: {
				...withSpring({
					delay: tokens.delays.footer,
					...tokens.spring.bubble,
				}),
			},
		};
	}, [responsiveValues.bubbleScale, responsiveValues.bubbleY, withSpring, tokens]);

	const getAnswerPanelLayoutAnimation = useCallback(
		(layout: AnswerPanelLayout) => {
			const baseAnimation = {
				initial: { opacity: 1, y: 0 },
				animate: showResult
					? {
							opacity: 1,
							y: responsiveValues.answerPanelMove,
							scale: responsiveValues.scaleDown,
					  }
					: { opacity: 1, y: 0, scale: 1 },
				transition: withTransition({
					duration: tokens.durations.slow,
					ease: tokens.easing.inOut,
				}),
			};

			if (layout === "horizontal") {
				return {
					...baseAnimation,
					animate: showResult
						? { ...baseAnimation.animate, scale: tokens.scale.down }
						: baseAnimation.animate,
				};
			}

			return baseAnimation;
		},
		[
			showResult,
			responsiveValues.answerPanelMove,
			responsiveValues.scaleDown,
			withTransition,
			tokens,
		]
	);

	const getAnswerButtonLayoutAnimation = useCallback(
		(index: number, layout: AnswerPanelLayout) => {
			if (layout === "horizontal") {
				return {
					initial: {
						opacity: 0,
						x: index === 0 ? -tokens.distances.xSmall : tokens.distances.xSmall,
					},
					animate: { opacity: 1, x: 0 },
					transition: withTransition({
						delay: index * tokens.delays.step,
						duration: tokens.durations.fast,
					}),
				};
			}

			return {
				initial: { opacity: 0, y: responsiveValues.buttonY },
				animate: { opacity: 1, y: 0 },
				transition: withTransition({
					delay: index * tokens.delays.step,
					duration: tokens.durations.fast,
				}),
			};
		},
		[responsiveValues.buttonY, withTransition, tokens]
	);

	const getQuestionExitAnimation = useCallback(() => {
		return {
			initial: { opacity: 0, y: tokens.distances.ySmall },
			animate: isInitialized
				? { opacity: 1, y: 0 }
				: { opacity: 0, y: tokens.distances.ySmall },
			exit: {
				opacity: 0,
				y: responsiveValues.questionExitY,
			},
			transition: withTransition({
				duration: tokens.durations.base,
				ease: tokens.easing.inOut,
				delay: isInitialized ? tokens.delays.base : 0,
			}),
		};
	}, [responsiveValues.questionExitY, isInitialized, withTransition, tokens]);

	const getBackgroundLayers = useCallback(
		(theme: "light" | "dark" = "light") => {
			const baseGradient =
				theme === "dark"
					? "linear-gradient(to bottom, #1e293b, #334155)"
					: "linear-gradient(to bottom, #dbeafe, #bfdbfe)";
			const resultGradient =
				theme === "dark"
					? "linear-gradient(to bottom, #0f172a, #020617)"
					: "linear-gradient(to bottom, #1e293b, #0f172a)";

			return {
				baseGradient,
				resultGradient,
				transition: withTransition({
					duration: tokens.durations.background,
					ease: tokens.easing.inOut,
				}),
			};
		},
		[withTransition, tokens]
	);

	const getResultCardAnimation = useCallback(() => {
		return {
			overlay: {
				initial: { opacity: 0 },
				animate: { opacity: 1 },
				exit: { opacity: 0 },
				transition: withTransition({ duration: tokens.durations.fast }),
			},
			card: {
				initial: { y: "100%", opacity: 0 },
				animate: { y: 0, opacity: 1 },
				exit: { y: "100%", opacity: 0 },
				transition: withSpring(tokens.spring.card),
			},
			title: {
				initial: { opacity: 0, y: tokens.distances.ySmall },
				animate: { opacity: 1, y: 0 },
				transition: withTransition({
					delay: tokens.delays.base,
					duration: tokens.durations.base,
				}),
			},
			content: {
				initial: { opacity: 0, y: tokens.distances.ySmall },
				animate: { opacity: 1, y: 0 },
				transition: withTransition({
					delay: tokens.delays.content,
					duration: tokens.durations.base,
				}),
			},
			button: {
				initial: { opacity: 0, y: tokens.distances.ySmall },
				animate: { opacity: 1, y: 0 },
				transition: withTransition({
					delay: tokens.delays.cta,
					duration: tokens.durations.base,
				}),
			},
		};
	}, [withSpring, withTransition, tokens]);

	const getLandingPageAnimation = useCallback(() => {
		const start = tokens.delays.landingStart;
		const step = tokens.delays.landingStep;

		return {
			container: {
				initial: { opacity: 0 },
				animate: { opacity: 1 },
				transition: withTransition({
					delay: start,
					duration: tokens.durations.base,
					ease: tokens.easing.in,
				}),
			},
			card: {
				initial: {
					opacity: 0,
					y: tokens.distances.yMedium,
					scale: tokens.scale.down,
				},
				animate: { opacity: 1, y: 0, scale: 1 },
				transition: withTransition({
					delay: start + step,
					duration: tokens.durations.medium,
					ease: tokens.easing.out,
				}),
			},
			title: {
				initial: { opacity: 0, y: tokens.distances.ySmall },
				animate: { opacity: 1, y: 0 },
				transition: withTransition({
					delay: start + step * 2,
					duration: tokens.durations.base,
				}),
			},
			subtitle: {
				initial: { opacity: 0, y: tokens.distances.ySmall },
				animate: { opacity: 1, y: 0 },
				transition: withTransition({
					delay: start + step * 3,
					duration: tokens.durations.base,
				}),
			},
			cta: {
				initial: { opacity: 0, y: tokens.distances.ySmall },
				animate: { opacity: 1, y: 0 },
				transition: withTransition({
					delay: start + step * 4,
					duration: tokens.durations.base,
				}),
				hover: { scale: tokens.scale.hover },
				tap: { scale: tokens.scale.press },
			},
			footer: {
				initial: { opacity: 0, y: tokens.distances.ySmall },
				animate: { opacity: 1, y: 0 },
				transition: withTransition({
					delay: start + step * 5,
					duration: tokens.durations.base,
				}),
			},
		};
	}, [tokens, withTransition]);

	return useMemo(
		() => ({
			getContentMotionProps,
			getChatScenarioMotionProps,
			getChatBubbleAnimation,
			getAnswerPanelLayoutAnimation,
			getAnswerButtonLayoutAnimation,
			getQuestionExitAnimation,
			getBackgroundLayers,
			getResultCardAnimation,
			getLandingPageAnimation,
			isInitialized,
		}),
		[
			getContentMotionProps,
			getChatScenarioMotionProps,
			getChatBubbleAnimation,
			getAnswerPanelLayoutAnimation,
			getAnswerButtonLayoutAnimation,
			getQuestionExitAnimation,
			getBackgroundLayers,
			getResultCardAnimation,
			getLandingPageAnimation,
			isInitialized,
		]
	);
};
