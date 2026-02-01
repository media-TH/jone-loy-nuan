// ⚙️ Application Constants and Configurations
import { QUIZ_MOTION_TOKENS } from "@/lib/motion/quiz-motion";

export const QUIZ_CONFIG = {
	RESULT_DELAY: 800, // milliseconds before showing result
	ANIMATION_DELAYS: {
		PAGE_CONTENT: 0.8,
		STAIR_STEP: 0.1,
	},
	DURATIONS: {
		TRANSITION: 1.0,
		STAIR_ANIMATION: 0.4,
	},
} as const;

export const BUTTON_VARIANTS = {
	QUIZ: "quiz",
	QUIZ_CORRECT: "quiz-correct",
	QUIZ_WRONG: "quiz-wrong",
} as const;

export const CONTENT_VARIANTS = {
	DEFAULT: "default",
	COMPACT: "compact",
	FULLSCREEN: "fullscreen",
} as const;

export const TOOLTIP_VARIANTS = {
	DEFAULT: "default",
	WARNING: "warning",
	DANGER: "danger",
	INFO: "info",
} as const;

export const DIRECTIONS = {
	UP: "up",
	DOWN: "down",
	LEFT: "left",
	RIGHT: "right",
} as const;

// Animation Presets
export const ANIMATION_PRESETS = {
	FADE_IN: {
		initial: { opacity: 0, y: QUIZ_MOTION_TOKENS.distances.ySmall },
		animate: { opacity: 1, y: 0 },
		transition: {
			duration: QUIZ_MOTION_TOKENS.durations.slow,
			ease: QUIZ_MOTION_TOKENS.easing.out,
		},
	},
	SLIDE_UP: {
		initial: { opacity: 0, y: QUIZ_MOTION_TOKENS.distances.yLarge },
		animate: { opacity: 1, y: 0 },
		transition: {
			duration: QUIZ_MOTION_TOKENS.durations.xslow,
			ease: QUIZ_MOTION_TOKENS.easing.out,
		},
	},
	SCALE_IN: {
		initial: { opacity: 0, scale: QUIZ_MOTION_TOKENS.scale.imageOut },
		animate: { opacity: 1, scale: 1 },
		transition: {
			duration: QUIZ_MOTION_TOKENS.durations.medium,
			ease: QUIZ_MOTION_TOKENS.easing.out,
		},
	},
	CONTENT_RESULT: {
		initial: { opacity: 1, y: 0, scale: 1 },
		animate: { y: -20, scale: 1, opacity: 0.7 },
		transition: {
			duration: QUIZ_MOTION_TOKENS.durations.long,
			ease: QUIZ_MOTION_TOKENS.easing.inOut,
			delay: QUIZ_MOTION_TOKENS.delays.base,
		},
	},
} as const;

// Responsive Breakpoints
export const BREAKPOINTS = {
	SM: "640px",
	MD: "768px",
	LG: "1024px",
	XL: "1280px",
} as const;
