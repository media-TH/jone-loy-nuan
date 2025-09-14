"use client";

import { useMemo, useEffect, useState, useCallback } from "react";

interface ScreenSize {
	width: number;
	height: number;
}

interface ScreenBreakpoints {
	isMobile: boolean;
	isTablet: boolean;
	isDesktop: boolean;
}

/**
 * Optimized hook for screen size detection and responsive breakpoints
 * Extracted from useQuizAnimations for better separation of concerns
 */
export function useScreenSize() {
	const [screenSize, setScreenSize] = useState<ScreenSize>(() => ({
		width: typeof window !== "undefined" ? window.innerWidth : 1024,
		height: typeof window !== "undefined" ? window.innerHeight : 768,
	}));

	const handleResize = useCallback(() => {
		setScreenSize({
			width: window.innerWidth,
			height: window.innerHeight,
		});
	}, []);

	useEffect(() => {
		if (typeof window === "undefined") return;

		// Set initial size
		handleResize();

		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, [handleResize]);

	// Memoize breakpoint calculations to avoid recalculation on every render
	const breakpoints = useMemo((): ScreenBreakpoints => {
		const { width } = screenSize;
		return {
			isMobile: width < 640,
			isTablet: width >= 640 && width < 1024,
			isDesktop: width >= 1024,
		};
	}, [screenSize.width]); // Only width matters for breakpoints

	return {
		...screenSize,
		...breakpoints,
	};
}