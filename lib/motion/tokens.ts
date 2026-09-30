/**
 * Motion tokens — mirror of the CSS custom properties in app/globals.css
 * (--dur-*, --ease-*) and of the สแกนโจร Design System artifact's Motion section.
 * Durations are in seconds because motion/react expects seconds.
 */

export const DUR = {
	instant: 0.09,
	quick: 0.16,
	base: 0.24,
	slow: 0.4,
	page: 0.56,
	scan: 0.9,
} as const;

export const EASE = {
	/** Settle: things arriving and coming to rest. */
	settle: [0.22, 1, 0.36, 1],
	/** Wipe: the Scan Wipe route transition and other full-surface sweeps. */
	wipe: [0.65, 0, 0.35, 1],
	/** Exit: things leaving the screen. */
	exit: [0.55, 0, 1, 0.45],
} as const;

// Animation configs stay loosely typed on purpose (see AGENTS.md).
export const SPRING: Record<"press" | "pin" | "sheet" | "layout", any> = {
	press: { type: "spring", stiffness: 700, damping: 40 },
	pin: { type: "spring", stiffness: 520, damping: 26 },
	sheet: { type: "spring", stiffness: 380, damping: 34 },
	layout: { type: "spring", stiffness: 460, damping: 38 },
};

export const STAGGER = {
	list: 0.06,
	pins: 0.08,
} as const;
