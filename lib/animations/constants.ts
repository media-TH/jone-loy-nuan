/**
 * Animation Constants - Centralized timing, easing, and responsive values
 * Replaces scattered magic numbers throughout the codebase
 */

// Duration constants (in seconds)
export const DURATION = {
	INSTANT: 0,
	FAST: 0.3,
	NORMAL: 0.4,
	SLOW: 0.6,
	RESULT_TRANSITION: 1.0,
	BACKGROUND_TRANSITION: 1.2,
} as const;

// Delay constants (in seconds)
export const DELAY = {
	NONE: 0,
	SHORT: 0.1,
	NORMAL: 0.2,
	LONG: 0.3,
	STAGGERED: 0.1, // For staggered animations
} as const;

// Easing curves
export const EASING = {
	EASE_IN: "easeIn",
	EASE_OUT: "easeOut", 
	EASE_IN_OUT: "easeInOut",
	LINEAR: "linear",
} as const;

// Spring configurations
export const SPRING = {
	GENTLE: {
		type: "spring",
		stiffness: 200,
		damping: 20,
	},
	BOUNCY: {
		type: "spring",
		stiffness: 300,
		damping: 25,
	},
	SNAPPY: {
		type: "spring",
		stiffness: 400,
		damping: 30,
	},
} as const;

// Responsive animation values
export const RESPONSIVE_VALUES = {
	// Y-axis movement values
	Y_MOVE: {
		mobile: -120,
		tablet: -75,
		desktop: -75,
	},
	// Answer panel movement
	ANSWER_PANEL_MOVE: {
		mobile: -10,
		tablet: -15,
		desktop: -20,
	},
	// Question exit movement
	QUESTION_EXIT_Y: {
		mobile: -20,
		tablet: -25,
		desktop: -30,
	},
	// Bubble animation values
	BUBBLE_Y: {
		mobile: 15,
		tablet: 20,
		desktop: 20,
	},
	BUBBLE_SCALE: {
		mobile: 0.85,
		tablet: 0.8,
		desktop: 0.8,
	},
	// Button animation values
	BUTTON_Y: {
		mobile: 15,
		tablet: 20,
		desktop: 20,
	},
	// Scale values
	SCALE_DOWN: 0.95,
} as const;

// Common animation patterns
export const ANIMATION_PATTERNS = {
	FADE_IN: {
		initial: { opacity: 0 },
		animate: { opacity: 1 },
	},
	FADE_OUT: {
		initial: { opacity: 1 },
		animate: { opacity: 0 },
	},
	SLIDE_UP: {
		initial: { opacity: 0, y: 20 },
		animate: { opacity: 1, y: 0 },
	},
	SLIDE_DOWN: {
		initial: { opacity: 0, y: -20 },
		animate: { opacity: 1, y: 0 },
	},
	SCALE_IN: {
		initial: { opacity: 0, scale: 0.95 },
		animate: { opacity: 1, scale: 1 },
	},
	SLIDE_LEFT: {
		initial: { opacity: 0, x: -20 },
		animate: { opacity: 1, x: 0 },
	},
	SLIDE_RIGHT: {
		initial: { opacity: 0, x: 20 },
		animate: { opacity: 1, x: 0 },
	},
} as const;

// Transition presets
export const TRANSITIONS = {
	FAST: {
		duration: DURATION.FAST,
		ease: EASING.EASE_OUT,
	},
	NORMAL: {
		duration: DURATION.NORMAL,
		ease: EASING.EASE_OUT,
	},
	SLOW: {
		duration: DURATION.SLOW,
		ease: EASING.EASE_IN_OUT,
	},
	RESULT: {
		duration: DURATION.RESULT_TRANSITION,
		ease: EASING.EASE_IN_OUT,
	},
	BACKGROUND: {
		duration: DURATION.BACKGROUND_TRANSITION,
		ease: EASING.EASE_IN_OUT,
	},
} as const;