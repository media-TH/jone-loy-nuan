export const QUIZ_MOTION_TOKENS = {
	durations: {
		xfast: 0.2,
		fast: 0.3,
		base: 0.4,
		medium: 0.5,
		slow: 0.6,
		xslow: 0.8,
		long: 1.0,
		background: 1.2,
	},
	delays: {
		step: 0.1,
		base: 0.2,
		content: 0.3,
		cta: 0.4,
		footer: 0.5,
		landingStart: 0.5,
		landingStep: 0.2,
		late: 0.8,
	},
	easing: {
		in: "easeIn" as const,
		out: "easeOut" as const,
		inOut: "easeInOut" as const,
	},
	distances: {
		yTiny: 10,
		yMicro: 15,
		ySmall: 20,
		yMedium: 30,
		yLarge: 60,
		xTiny: 8,
		xSmall: 20,
		quizLiftMobile: 120,
		quizLiftDesktop: 75,
	},
	scale: {
		zero: 0,
		half: 0.5,
		subtle: 0.9,
		down: 0.95,
		bubbleMobile: 0.85,
		bubbleDesktop: 0.8,
		imageOut: 0.8,
		imageIn: 1.2,
		hover: 1.02,
		press: 0.98,
		pressStrong: 0.92,
		emphasis: 1.05,
		iconHover: 1.1,
		ripple: 2,
	},
	spring: {
		bubble: { type: "spring" as const, stiffness: 200, damping: 20 },
		card: { type: "spring" as const, stiffness: 300, damping: 25 },
		redFlag: { type: "spring" as const, stiffness: 200, damping: 15 },
	},
} as const;

export const reduceMotionTransition = (
	reduceMotion: boolean,
	transition: Record<string, unknown>
) => (reduceMotion ? { duration: 0 } : transition);

export const reduceMotionSpring = (
	reduceMotion: boolean,
	transition: Record<string, unknown>
) => (reduceMotion ? { type: "tween", duration: 0 } : transition);
