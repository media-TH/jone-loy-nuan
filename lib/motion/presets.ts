export const MOTION_PRESETS = {
	fadeIn: {
		hidden: { opacity: 0 },
		visible: { opacity: 1 },
	},
	slideUp: {
		hidden: { opacity: 0, y: 20 },
		visible: { opacity: 1, y: 0 },
	},
	slideLeft: {
		hidden: { opacity: 0, x: 24 },
		visible: { opacity: 1, x: 0 },
	},
	stagger: {
		hidden: {},
		visible: {
			transition: {
				staggerChildren: 0.08,
				delayChildren: 0.05,
			},
		},
	},
	page: {
		initial: { opacity: 0, y: 8 },
		animate: { opacity: 1, y: 0 },
		exit: { opacity: 0, y: -8 },
		transition: { duration: 0.3, ease: "easeOut" },
	},
};

export const withReducedMotion = (
	prefersReducedMotion: boolean,
	config: Record<string, unknown>
) => {
	if (!prefersReducedMotion) return config;

	const reduced: Record<string, unknown> = { ...config };
	if (reduced.hidden) {
		reduced.hidden = { opacity: 0 };
	}
	if (reduced.visible) {
		reduced.visible = { opacity: 1, transition: { duration: 0 } };
	}
	return reduced;
};

export const interactionMotion = (prefersReducedMotion: boolean) => ({
	whileHover: prefersReducedMotion ? {} : { scale: 1.02 },
	whileTap: prefersReducedMotion ? {} : { scale: 0.98 },
});
