"use client";

/**
 * Moment 1 — Scan Wipe route transition.
 *
 * App Router unmounts the old page as soon as the route commits, so exit animations on
 * the page itself are unreliable. Instead a navy panel covers the screen first
 * (bottom → top, with a scan line on its leading edge), the route is pushed while the
 * screen is covered, and the panel continues off the top once the new pathname renders.
 *
 * Back/forward and plain <Link> navigations skip the wipe; app/(main)/template.tsx gives
 * those (and every navigation under reduced motion, which skips the wipe entirely) the 120ms
 * crossfade instead.
 *
 * A navigation is never dropped: one that arrives while a wipe is running (a second tap, Back
 * during the cover) goes straight to the router, and the running wipe then reveals whatever
 * page is showing instead of pushing its own, now stale, target.
 */

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { m, useReducedMotion } from "motion/react";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ComponentProps,
	type MouseEvent,
	type ReactNode,
} from "react";
import { wipePanel } from "@/lib/motion/presets";

type Phase = "idle" | "covering" | "covered" | "revealing";

type WipeState = {
	phase: Phase;
	href: string | null;
	replace: boolean;
	/** Pathname the navigation started from; reveal starts once it changes. */
	from: string | null;
};

type NavigateOptions = { replace?: boolean };

type ScanTransitionContextValue = {
	/** Starts the wipe, or navigates directly when a wipe cannot run. Never drops a navigation. */
	navigate: (href: string, options?: NavigateOptions) => void;
	isTransitioning: boolean;
};

const IDLE: WipeState = { phase: "idle", href: null, replace: false, from: null };
/** Never leave the screen covered longer than this, even if the route never commits. */
const MAX_COVERED_MS = 5000;

const ScanTransitionContext = createContext<ScanTransitionContextValue | null>(null);

export function ScanTransitionProvider({ children }: { children: ReactNode }) {
	const router = useRouter();
	const pathname = usePathname();
	const prefersReducedMotion = useReducedMotion();
	const [state, setState] = useState<WipeState>(IDLE);

	const go = useCallback(
		(href: string, replace: boolean) => {
			if (replace) router.replace(href);
			else router.push(href);
		},
		[router],
	);

	const navigate = useCallback(
		(href: string, options?: NavigateOptions) => {
			const replace = options?.replace ?? false;
			if (state.phase !== "idle") {
				// Already queued behind the running cover (e.g. a double tap): nothing to add.
				if ((state.phase === "covering" || state.phase === "covered") && href === state.href) return;
				go(href, replace);
				return;
			}

			const target = new URL(href, window.location.href);
			const isSamePage = target.pathname === window.location.pathname;
			if (prefersReducedMotion || isSamePage || target.origin !== window.location.origin) {
				go(href, replace);
				return;
			}
			setState({ phase: "covering", href, replace, from: pathname });
		},
		[go, pathname, prefersReducedMotion, state.phase, state.href],
	);

	// Derived, not stored: once the new route has rendered, the panel reveals.
	const visualPhase: Phase =
		state.phase === "covered" && pathname !== state.from ? "revealing" : state.phase;

	useEffect(() => {
		if (state.phase !== "covered") return;
		const timer = setTimeout(
			() => setState((s) => (s.phase === "covered" ? { ...s, phase: "revealing" } : s)),
			MAX_COVERED_MS,
		);
		return () => clearTimeout(timer);
	}, [state.phase]);

	const handleAnimationComplete = (definition: unknown) => {
		if (definition === "covering" && state.phase === "covering" && state.href) {
			if (pathname !== state.from) {
				// The route changed while covering (Back, or a navigation that did not wait):
				// reveal that page and drop the stale push.
				setState((s) => ({ ...s, phase: "revealing" }));
				return;
			}
			setState((s) => ({ ...s, phase: "covered" }));
			go(state.href, state.replace);
		} else if (definition === "revealing") {
			setState(IDLE);
		}
	};

	const value = useMemo(
		() => ({ navigate, isTransitioning: state.phase !== "idle" }),
		[navigate, state.phase],
	);

	const isActive = visualPhase !== "idle";

	return (
		<ScanTransitionContext.Provider value={value}>
			{children}
			<m.div
				aria-hidden
				data-phase={visualPhase}
				className={`fixed inset-0 z-(--layer-transition) bg-navy-800 ${
					isActive ? "pointer-events-auto" : "pointer-events-none invisible"
				}`}
				variants={wipePanel}
				initial={false}
				animate={visualPhase === "covered" ? "covering" : visualPhase}
				onAnimationComplete={handleAnimationComplete}
			>
				{/* Leading edge: the scan line */}
				<div className="absolute inset-x-0 top-0 h-0.5 bg-screen-300" />
				<div className="absolute inset-0 grid place-items-center">
					<span className="type-label text-screen-300">กำลังสแกน…</span>
				</div>
			</m.div>
		</ScanTransitionContext.Provider>
	);
}

/**
 * True while a Scan Wipe is on screen. app/(main)/template.tsx reads it when a page mounts: a
 * page that arrives under the panel needs no enter animation of its own.
 */
export function useScanWipeActive(): boolean {
	return useContext(ScanTransitionContext)?.isTransitioning ?? false;
}

/** Programmatic navigation with the Scan Wipe (falls back to the plain router). */
export function useTransitionRouter() {
	const ctx = useContext(ScanTransitionContext);
	const router = useRouter();
	return useMemo(
		() => ({
			push: (href: string) => (ctx ? ctx.navigate(href) : router.push(href)),
			replace: (href: string) =>
				ctx ? ctx.navigate(href, { replace: true }) : router.replace(href),
			isTransitioning: ctx?.isTransitioning ?? false,
		}),
		[ctx, router],
	);
}

type TransitionLinkProps = ComponentProps<typeof Link>;

/** next/link that plays the Scan Wipe for same-origin, plain left clicks. */
export function TransitionLink({ href, onClick, replace, target, ...props }: TransitionLinkProps) {
	const ctx = useContext(ScanTransitionContext);

	const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
		onClick?.(event);
		if (event.defaultPrevented || !ctx) return;
		if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
			return;
		}
		if (target && target !== "_self") return;
		if (typeof href !== "string" || !href.startsWith("/")) return;
		event.preventDefault();
		ctx.navigate(href, { replace: replace ?? false });
	};

	return <Link href={href} replace={replace} target={target} onClick={handleClick} {...props} />;
}
