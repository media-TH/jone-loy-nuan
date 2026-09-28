"use client";

import { m } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import { fadeUp } from "@/lib/motion/presets";

/**
 * Enter animation for client-side navigations inside (main).
 * The first server-rendered paint is never hidden: starting at opacity 0 would hold back
 * LCP until hydration. Only navigations after the first load animate in.
 */
let hasHydrated = false;

export default function MainTemplate({ children }: { children: ReactNode }) {
	const [initial] = useState<"hidden" | false>(() => (hasHydrated ? "hidden" : false));

	useEffect(() => {
		hasHydrated = true;
	}, []);

	return (
		<m.div variants={fadeUp} initial={initial} animate="show">
			{children}
		</m.div>
	);
}
