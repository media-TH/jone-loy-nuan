"use client";

import { useMemo, useEffect, useState, useCallback } from "react";
import { DURATION, EASE, SPRING } from "@/lib/animations";
import type { AnswerPanelLayout } from "@/lib/types";

/**
 * Optimized breakpoint detection using matchMedia
 */
function useBreakpoints() {
  const [state, setState] = useState({ isMobile: false, isTablet: false, isDesktop: true });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mMobile = window.matchMedia("(max-width: 639px)");
    const mTablet = window.matchMedia("(min-width: 640px) and (max-width: 1023px)");
    const mDesktop = window.matchMedia("(min-width: 1024px)");

    const update = () => {
      setState({ isMobile: mMobile.matches, isTablet: mTablet.matches, isDesktop: mDesktop.matches });
    };

    update();

    const add = (mql: MediaQueryList, handler: () => void) => {
      try {
        mql.addEventListener("change", handler);
      } catch {
        // @ts-ignore
        mql.addListener(handler);
      }
    };
    const remove = (mql: MediaQueryList, handler: () => void) => {
      try {
        mql.removeEventListener("change", handler);
      } catch {
        // @ts-ignore
        mql.removeListener(handler);
      }
    };

    add(mMobile, update);
    add(mTablet, update);
    add(mDesktop, update);

    return () => {
      remove(mMobile, update);
      remove(mTablet, update);
      remove(mDesktop, update);
    };
  }, []);

  return state;
}

function getLandingPageAnimation() {
	return {
		// Main container
		container: {
			initial: { opacity: 0 },
			animate: { opacity: 1 },
            transition: { delay: 0.5, duration: DURATION.fast * 2, ease: EASE.in },
		},
		// Card container
		card: {
			initial: { opacity: 0, y: 30, scale: 0.95 },
			animate: { opacity: 1, y: 0, scale: 1 },
            transition: { delay: 0.7, duration: DURATION.slow - 0.1, ease: EASE.out },
		},
		// Title
		title: {
			initial: { opacity: 0, y: 20 },
			animate: { opacity: 1, y: 0 },
            transition: { delay: 0.9, duration: DURATION.fast * 2 },
		},
		// Subtitle
		subtitle: {
			initial: { opacity: 0, y: 20 },
			animate: { opacity: 1, y: 0 },
            transition: { delay: 1.1, duration: DURATION.fast * 2 },
		},
		// CTA Button
		cta: {
			initial: { opacity: 0, y: 20 },
			animate: { opacity: 1, y: 0 },
            transition: { delay: 1.3, duration: DURATION.fast * 2 },
			// Interactive states
			hover: { scale: 1.02 },
			tap: { scale: 0.98 },
		},
		// Footer
		footer: {
			initial: { opacity: 0, y: 20 },
			animate: { opacity: 1, y: 0 },
            transition: { delay: 1.5, duration: DURATION.fast * 2 },
		},
	};
}

/**
 * 🎨 Animation Logic - Fixed infinite loop issues
 */
export const useQuizAnimations = (showResult: boolean) => {
	const { isMobile, isTablet, isDesktop } = useBreakpoints();
	const [isInitialized, setIsInitialized] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => {
			setIsInitialized(true);
		}, 500);

		return () => clearTimeout(timer);
	}, []);

	// ✅ FIXED: Memoize responsive values with proper dependencies
	const responsiveValues = useMemo(() => {
		return {
			yMove: isMobile ? -120 : isTablet ? -75 : -75,
			scaleDown: 0.95,
			answerPanelMove: isMobile ? -10 : isTablet ? -15 : -20,
			questionExitY: isMobile ? -20 : isTablet ? -25 : -30,
			bubbleY: isMobile ? 15 : 20,
			bubbleScale: isMobile ? 0.85 : 0.8,
			buttonY: isMobile ? 15 : 20,
			isMobile,
			isTablet,
			isDesktop,
		};
	}, [isMobile, isTablet, isDesktop]);

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
        transition: { duration: DURATION.xslow, ease: EASE.default, delay: showResult ? 0.2 : 0 },
		};
	}, [showResult, responsiveValues.yMove, responsiveValues.scaleDown]);

	const getChatScenarioMotionProps = useCallback(() => {
		return {
			initial: { opacity: 1, y: 0, scale: 1 },
			animate: showResult
				? { y: responsiveValues.yMove, scale: 1, opacity: 1.0 }
				: { y: 0, scale: 1, opacity: 1 },
        transition: { duration: DURATION.xslow, ease: EASE.default, delay: showResult ? 0.2 : 0 },
		};
	}, [showResult, responsiveValues.yMove]);

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
        transition: { delay: 0.5, duration: DURATION.slow, ...SPRING.soft },
		};
	}, [responsiveValues.bubbleScale, responsiveValues.bubbleY]);

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
        transition: { duration: DURATION.slow, ease: EASE.default },
			};

			if (layout === "horizontal") {
				return {
					...baseAnimation,
					animate: showResult
						? { ...baseAnimation.animate, scale: 0.95 }
						: baseAnimation.animate,
				};
			}

			return baseAnimation;
		},
		[showResult, responsiveValues.answerPanelMove, responsiveValues.scaleDown]
	);

	const getAnswerButtonLayoutAnimation = useCallback(
		(index: number, layout: AnswerPanelLayout) => {
			if (layout === "horizontal") {
				return {
					initial: { opacity: 0, x: index === 0 ? -20 : 20 },
					animate: { opacity: 1, x: 0 },
        transition: { delay: index * 0.1, duration: DURATION.fast + 0.1 },
				};
			}

			return {
				initial: { opacity: 0, y: responsiveValues.buttonY },
				animate: { opacity: 1, y: 0 },
        transition: { delay: index * 0.1, duration: DURATION.fast + 0.1 },
			};
		},
		[responsiveValues.buttonY]
	);

	const getQuestionExitAnimation = useCallback(() => {
		return {
			initial: { opacity: 0, y: 20 },
			animate: isInitialized ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 },
			exit: {
				opacity: 0,
				y: responsiveValues.questionExitY,
			},
        transition: { duration: DURATION.fast * 2, ease: EASE.default, delay: isInitialized ? 0.2 : 0 },
		};
	}, [responsiveValues.questionExitY, isInitialized]);

	const getBackgroundAnimation = useCallback(
		(theme: "light" | "dark" = "light") => {
			const getBackgroundGradient = () => {
				if (theme === "dark") {
					return showResult
						? "linear-gradient(to bottom, #0f172a, #020617)"
						: "linear-gradient(to bottom, #1e293b, #334155)";
				}

				return showResult
					? "linear-gradient(to bottom, #1e293b, #0f172a)"
					: "linear-gradient(to bottom, #dbeafe, #bfdbfe)";
			};

			return {
				animate: {
					background: getBackgroundGradient(),
				},
        transition: { duration: 1.2, ease: EASE.default },
			};
		},
		[showResult]
	);

	const getResultCardAnimation = () => {
		return {
			overlay: {
				initial: { opacity: 0 },
				animate: { opacity: 1 },
				exit: { opacity: 0 },
            transition: { duration: DURATION.fast + 0.1 },
			},
			card: {
				initial: { y: "100%", opacity: 0 },
				animate: { y: 0, opacity: 1 },
				exit: { y: "100%", opacity: 0 },
            transition: { ...SPRING.firm },
			},
			title: {
				initial: { opacity: 0, y: 20 },
				animate: { opacity: 1, y: 0 },
            transition: { delay: 0.2, duration: DURATION.fast * 2 },
			},
			content: {
				initial: { opacity: 0, y: 20 },
				animate: { opacity: 1, y: 0 },
            transition: { delay: 0.3, duration: DURATION.fast * 2 },
			},
			button: {
				initial: { opacity: 0, y: 20 },
				animate: { opacity: 1, y: 0 },
            transition: { delay: 0.4, duration: DURATION.fast * 2 },
			},
		};
	};

	return useMemo(
		() => ({
			getContentMotionProps,
			getChatScenarioMotionProps,
			getChatBubbleAnimation,
			getAnswerPanelLayoutAnimation,
			getAnswerButtonLayoutAnimation,
			getQuestionExitAnimation,
			getBackgroundAnimation,
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
			getBackgroundAnimation,
			getResultCardAnimation,
			getLandingPageAnimation,
			isInitialized,
		]
	);
};
