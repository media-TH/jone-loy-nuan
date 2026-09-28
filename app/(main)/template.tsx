"use client";

import { m } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import { useScanWipeActive } from "@/components/motion/scan-transition";
import { routeCrossfade } from "@/lib/motion/presets";

/**
 * Route change fallback for (main) — the 120ms crossfade of Moment 1, for navigations the Scan
 * Wipe did not cover: reduced motion, back/forward and plain links. A page that arrives under
 * the wipe panel, and the first server-rendered paint (never hidden: opacity 0 there would hold
 * back LCP until hydration), render as they are.
 *
 * Object targets instead of variant labels, so no child m.* inherits an entrance from here.
 */
let hasHydrated = false;

export default function MainTemplate({ children }: { children: ReactNode }) {
	const wipeActive = useScanWipeActive();
	// Decided once, when this page mounts.
	const [crossfade] = useState(() => hasHydrated && !wipeActive);

	useEffect(() => {
		hasHydrated = true;
	}, []);

	return (
		<m.div
			initial={crossfade ? routeCrossfade.initial : false}
			animate={routeCrossfade.animate}
			transition={routeCrossfade.transition}
		>
			{children}
		</m.div>
	);
}
