/**
 * The motion moments of the "Scan & Flag" system, as reusable variants.
 * Nothing outside this inventory should animate (see docs/greenfield/ADR-002-motion-and-transitions.md).
 *
 * Reduced motion: <MotionConfig reducedMotion="user"> (components/motion/motion-provider.tsx)
 * drops transform/layout animation automatically and keeps opacity + colour, which is the
 * intended fallback for every preset here. Purely decorative moments skip entirely: the Scan
 * Reveal band is hidden with `motion-reduce:hidden`, the score count-up checks useReducedMotion().
 */
import { DUR, EASE, SPRING, STAGGER } from "./tokens";

type AnyVariants = Record<string, any>;

/**
 * Moment 1 fallback — a 120ms opacity crossfade for route changes the Scan Wipe did not cover
 * (reduced motion, back/forward). Opacity only, so reduced motion keeps it. Object targets, not
 * variant labels, so children never inherit it (see app/(main)/template.tsx).
 */
export const routeCrossfade: any = {
	initial: { opacity: 0 },
	animate: { opacity: 1 },
	transition: { duration: 0.12, ease: EASE.settle },
};

/** Generic entrance: 12px rise + fade. Page content, cards, list rows. */
export const fadeUp: AnyVariants = {
	hidden: { opacity: 0, y: 12 },
	show: { opacity: 1, y: 0, transition: { duration: DUR.base, ease: EASE.settle } },
	exit: { opacity: 0, y: -8, transition: { duration: DUR.quick, ease: EASE.exit } },
};

/** Parent that staggers its children (use with fadeUp / flagPlant children). */
export const staggerChildren = (
	stagger: number = STAGGER.list,
	delayChildren = 0,
): AnyVariants => ({
	hidden: {},
	show: { transition: { staggerChildren: stagger, delayChildren } },
	exit: { transition: { staggerChildren: stagger / 2, staggerDirection: -1 } },
});

/** Moment 3 — Flag Plant: a red-flag pin drops onto the evidence. */
export const flagPlant: AnyVariants = {
	hidden: { opacity: 0, y: -12, scale: 0.6, rotate: -8 },
	show: { opacity: 1, y: 0, scale: 1, rotate: 0, transition: SPRING.pin },
	exit: { opacity: 0, scale: 0.8, transition: { duration: DUR.quick, ease: EASE.exit } },
};

/** Moment 3 — the single ring pulse that follows a planted pin. */
export const pinPulse: AnyVariants = {
	hidden: { opacity: 0.5, scale: 1 },
	show: {
		opacity: 0,
		scale: 1.8,
		transition: { duration: DUR.slow, ease: EASE.settle, delay: 0.12 },
	},
};

/** Moment 4 — wrong-answer nudge. Transform-only, so reduced motion removes it. */
export const wrongNudge: any = {
	x: [0, -4, 4, -2, 0],
	transition: { duration: DUR.slow, ease: EASE.settle },
};

/** Moment 4 — press feedback for tappable surfaces. */
export const pressable: any = {
	whileTap: { scale: 0.98 },
	transition: SPRING.press,
};

/** Moment 4 — check / cross icon stroke draw. */
export const iconDraw: AnyVariants = {
	hidden: { pathLength: 0, opacity: 0 },
	show: {
		pathLength: 1,
		opacity: 1,
		transition: { duration: DUR.base, ease: EASE.settle },
	},
};

/** Moment 5 — Result Sheet rises from the bottom edge. */
export const sheetUp: AnyVariants = {
	hidden: { y: "100%" },
	show: { y: 0, transition: SPRING.sheet },
	exit: { y: "100%", transition: { duration: DUR.base, ease: EASE.exit } },
};

/** Moment 5 — scrim behind sheets and dialogs. */
export const scrimFade: AnyVariants = {
	hidden: { opacity: 0 },
	show: { opacity: 1, transition: { duration: DUR.base, ease: EASE.settle } },
	exit: { opacity: 0, transition: { duration: DUR.quick, ease: EASE.exit } },
};

/** Moment 2 — Scan Reveal band sweep (see components/motion/scan-reveal.tsx). */
export const scanSweep: any = {
	initial: { y: "-100%" },
	animate: { y: "100%" },
	transition: { duration: DUR.scan, ease: EASE.wipe },
};

/** Moment 6 — Progress Rail indicator (shared layoutId). */
export const railIndicator: any = {
	layout: true,
	transition: SPRING.layout,
};

/** Moment 1 — Scan Wipe panel positions (see components/motion/scan-transition.tsx). */
export const wipePanel: AnyVariants = {
	idle: { y: "100%", transition: { duration: 0 } },
	covering: { y: "0%", transition: { duration: DUR.page, ease: EASE.wipe } },
	revealing: { y: "-100%", transition: { duration: DUR.page, ease: EASE.wipe } },
};
