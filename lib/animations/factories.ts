import type { AnswerPanelLayout } from "@/lib/types";
import { 
	DURATION, 
	DELAY, 
	EASING, 
	SPRING, 
	RESPONSIVE_VALUES, 
	ANIMATION_PATTERNS, 
	TRANSITIONS 
} from "./constants";

/**
 * Animation Factories - Create reusable animation objects
 * Replaces repetitive animation object creation in useQuizAnimations
 */

interface BreakpointValues<T> {
	mobile: T;
	tablet: T;
	desktop: T;
}

interface ResponsiveProps {
	isMobile: boolean;
	isTablet: boolean;
	isDesktop: boolean;
}

/**
 * Get responsive value based on current breakpoint
 */
function getResponsiveValue<T>(values: BreakpointValues<T>, { isMobile, isTablet }: ResponsiveProps): T {
	if (isMobile) return values.mobile;
	if (isTablet) return values.tablet;
	return values.desktop;
}

/**
 * Landing page animations
 */
export function createLandingPageAnimations() {
	return {
		container: {
			...ANIMATION_PATTERNS.FADE_IN,
			transition: { delay: 0.5, ...TRANSITIONS.NORMAL },
		},
		card: {
			...ANIMATION_PATTERNS.SCALE_IN,
			transition: { delay: 0.7, duration: DURATION.SLOW, ease: EASING.EASE_OUT },
		},
		title: {
			...ANIMATION_PATTERNS.SLIDE_UP,
			transition: { delay: 0.9, ...TRANSITIONS.NORMAL },
		},
		subtitle: {
			...ANIMATION_PATTERNS.SLIDE_UP,
			transition: { delay: 1.1, ...TRANSITIONS.NORMAL },
		},
		cta: {
			...ANIMATION_PATTERNS.SLIDE_UP,
			transition: { delay: 1.3, ...TRANSITIONS.NORMAL },
			// Interactive states
			hover: { scale: 1.02 },
			tap: { scale: 0.98 },
		},
		footer: {
			...ANIMATION_PATTERNS.SLIDE_UP,
			transition: { delay: 1.5, ...TRANSITIONS.NORMAL },
		},
	};
}

/**
 * Content motion animations
 */
export function createContentMotionProps(showResult: boolean, responsive: ResponsiveProps) {
	const yMove = getResponsiveValue(RESPONSIVE_VALUES.Y_MOVE, responsive);
	const scaleDown = RESPONSIVE_VALUES.SCALE_DOWN;

	return {
		initial: { opacity: 1, y: 0, scale: 1 },
		animate: showResult
			? {
					y: yMove,
					scale: scaleDown,
					opacity: 1,
			  }
			: { y: 0, scale: 1, opacity: 1 },
		transition: {
			...TRANSITIONS.RESULT,
			delay: showResult ? DELAY.NORMAL : DELAY.NONE,
		},
	};
}

/**
 * Chat scenario motion animations (simplified version of content motion)
 */
export function createChatScenarioMotionProps(showResult: boolean, responsive: ResponsiveProps) {
	const yMove = getResponsiveValue(RESPONSIVE_VALUES.Y_MOVE, responsive);

	return {
		initial: { opacity: 1, y: 0, scale: 1 },
		animate: showResult
			? { y: yMove, scale: 1, opacity: 1.0 }
			: { y: 0, scale: 1, opacity: 1 },
		transition: {
			...TRANSITIONS.RESULT,
			delay: showResult ? DELAY.NORMAL : DELAY.NONE,
		},
	};
}

/**
 * Chat bubble animation
 */
export function createChatBubbleAnimation(responsive: ResponsiveProps) {
	const bubbleScale = getResponsiveValue(RESPONSIVE_VALUES.BUBBLE_SCALE, responsive);
	const bubbleY = getResponsiveValue(RESPONSIVE_VALUES.BUBBLE_Y, responsive);

	return {
		initial: {
			opacity: 0,
			scale: bubbleScale,
			y: bubbleY,
		},
		animate: {
			opacity: 1,
			scale: 1,
			y: 0,
		},
		transition: {
			delay: 0.5,
			duration: DURATION.SLOW,
			...SPRING.GENTLE,
		},
	};
}

/**
 * Answer panel layout animations
 */
export function createAnswerPanelLayoutAnimation(
	layout: AnswerPanelLayout,
	showResult: boolean,
	responsive: ResponsiveProps
) {
	const answerPanelMove = getResponsiveValue(RESPONSIVE_VALUES.ANSWER_PANEL_MOVE, responsive);
	const scaleDown = RESPONSIVE_VALUES.SCALE_DOWN;

	const baseAnimation = {
		initial: { opacity: 1, y: 0 },
		animate: showResult
			? {
					opacity: 1,
					y: answerPanelMove,
					scale: scaleDown,
			  }
			: { opacity: 1, y: 0, scale: 1 },
		transition: { duration: DURATION.SLOW, ease: EASING.EASE_IN_OUT },
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
}

/**
 * Answer button layout animations
 */
export function createAnswerButtonLayoutAnimation(
	index: number,
	layout: AnswerPanelLayout,
	responsive: ResponsiveProps
) {
	if (layout === "horizontal") {
		return {
			initial: { opacity: 0, x: index === 0 ? -20 : 20 },
			animate: { opacity: 1, x: 0 },
			transition: { delay: index * DELAY.STAGGERED, ...TRANSITIONS.FAST },
		};
	}

	const buttonY = getResponsiveValue(RESPONSIVE_VALUES.BUTTON_Y, responsive);

	return {
		initial: { opacity: 0, y: buttonY },
		animate: { opacity: 1, y: 0 },
		transition: { delay: index * DELAY.STAGGERED, ...TRANSITIONS.FAST },
	};
}

/**
 * Question exit animation with initialization check
 */
export function createQuestionExitAnimation(isInitialized: boolean, responsive: ResponsiveProps) {
	const questionExitY = getResponsiveValue(RESPONSIVE_VALUES.QUESTION_EXIT_Y, responsive);

	return {
		initial: { opacity: 0, y: 20 },
		animate: isInitialized ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 },
		exit: {
			opacity: 0,
			y: questionExitY,
		},
		transition: {
			...TRANSITIONS.NORMAL,
			delay: isInitialized ? DELAY.NORMAL : DELAY.NONE,
		},
	};
}

/**
 * Background animation with theme support
 */
export function createBackgroundAnimation(theme: "light" | "dark" = "light", showResult: boolean) {
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
		transition: TRANSITIONS.BACKGROUND,
	};
}

/**
 * Result card animations
 */
export function createResultCardAnimations() {
	return {
		overlay: {
			...ANIMATION_PATTERNS.FADE_IN,
			exit: { opacity: 0 },
			transition: { ...TRANSITIONS.FAST },
		},
		card: {
			initial: { y: "100%", opacity: 0 },
			animate: { y: 0, opacity: 1 },
			exit: { y: "100%", opacity: 0 },
			transition: SPRING.BOUNCY,
		},
		title: {
			...ANIMATION_PATTERNS.SLIDE_UP,
			transition: { delay: DELAY.NORMAL, ...TRANSITIONS.NORMAL },
		},
		content: {
			...ANIMATION_PATTERNS.SLIDE_UP,
			transition: { delay: DELAY.LONG, ...TRANSITIONS.NORMAL },
		},
		button: {
			...ANIMATION_PATTERNS.SLIDE_UP,
			transition: { delay: 0.4, ...TRANSITIONS.NORMAL },
		},
	};
}