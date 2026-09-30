"use client";

import { AnimatePresence, m } from "motion/react";
import {
	Children,
	isValidElement,
	useEffect,
	useId,
	useRef,
	useSyncExternalStore,
	type KeyboardEvent,
	type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { StatusIcon } from "@/components/ds/status-icon";
import { fadeUp, scrimFade, sheetUp, staggerChildren } from "@/lib/motion/presets";
import { DUR, STAGGER } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

type ResultVerdict = "correct" | "wrong";

const VERDICT = {
	correct: {
		word: "ถูกต้อง",
		icon: "check",
		band: "bg-safe-soft",
		badge: "bg-safe text-on-safe",
	},
	wrong: {
		word: "โดนหลอกแล้ว",
		icon: "cross",
		band: "bg-flag-soft",
		badge: "bg-flag text-on-flag",
	},
} as const;

// Content starts rising while the sheet is still arriving.
const contentStagger = staggerChildren(STAGGER.list, DUR.quick);

const FOCUSABLE = [
	"a[href]",
	"button:not([disabled])",
	"input:not([disabled]):not([type='hidden'])",
	"select:not([disabled])",
	"textarea:not([disabled])",
	"[tabindex]:not([tabindex='-1'])",
].join(",");

const subscribeNothing = () => () => {};

/** false on the server and during hydration, true afterwards (the sheet portals to <body>). */
function useIsClient() {
	return useSyncExternalStore(
		subscribeNothing,
		() => true,
		() => false,
	);
}

type ResultSheetProps = {
	open: boolean;
	verdict: ResultVerdict;
	title: ReactNode;
	/** Each child rises in turn (Moment 5 stagger). */
	children: ReactNode;
	/** Buttons pinned to the bottom of the sheet, e.g. the spark "ข้อต่อไป". */
	actions?: ReactNode;
	/** Id for the title element that labels the dialog; generated when omitted. */
	labelledById?: string;
	/** Escape or a tap on the scrim. Omit to make the sheet a required step. */
	onDismiss?: () => void;
	className?: string;
};

/** Bottom sheet with the answer's verdict band (word + icon), explanation and next action. */
function ResultSheet({
	open,
	verdict,
	title,
	children,
	actions,
	labelledById,
	onDismiss,
	className,
}: ResultSheetProps) {
	const isClient = useIsClient();
	const generatedId = useId();
	const titleId = labelledById ?? `${generatedId}-title`;
	const titleRef = useRef<HTMLHeadingElement>(null);
	const { word, icon, band, badge } = VERDICT[verdict];

	// Focus the title on open; hand focus back to where it was when the sheet closes.
	useEffect(() => {
		if (!open || !isClient) return;
		const returnFocusTo =
			document.activeElement instanceof HTMLElement ? document.activeElement : null;
		titleRef.current?.focus({ preventScroll: true });
		return () => {
			if (returnFocusTo?.isConnected) returnFocusTo.focus({ preventScroll: true });
		};
	}, [open, isClient]);

	const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
		if (event.key === "Escape" && onDismiss) {
			event.stopPropagation();
			onDismiss();
			return;
		}
		if (event.key !== "Tab") return;

		// Keep Tab inside the modal sheet.
		const focusables = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
			(element) => element.getAttribute("aria-hidden") !== "true",
		);
		const first = focusables[0];
		const last = focusables[focusables.length - 1];
		const active = document.activeElement;
		if (!first || !last) {
			event.preventDefault();
		} else if (event.shiftKey && (active === first || active === titleRef.current)) {
			event.preventDefault();
			last.focus();
		} else if (!event.shiftKey && active === last) {
			event.preventDefault();
			first.focus();
		}
	};

	if (!isClient) return null;

	return createPortal(
		<AnimatePresence>
			{open && (
				<div
					key="ds-result-sheet"
					className="fixed inset-0 z-(--layer-sheet) flex flex-col justify-end"
				>
					<m.div
						aria-hidden
						className={cn("absolute inset-0 touch-none bg-scrim", onDismiss && "cursor-pointer")}
						variants={scrimFade}
						initial="hidden"
						animate="show"
						exit="exit"
						onClick={onDismiss}
					/>
					<m.div
						role="dialog"
						aria-modal="true"
						aria-labelledby={titleId}
						data-slot="ds-result-sheet"
						data-verdict={verdict}
						onKeyDown={handleKeyDown}
						className={cn(
							"relative mx-auto flex max-h-[85dvh] w-full max-w-[34rem] flex-col",
							"overflow-y-auto overscroll-contain rounded-t-lg bg-surface-raised text-ink shadow-sheet",
							className,
						)}
						variants={sheetUp}
						initial="hidden"
						animate="show"
						exit="exit"
					>
						<div className={cn("flex shrink-0 items-center gap-3 px-4 py-3 sm:px-8", band)}>
							<span className={cn("grid size-8 shrink-0 place-items-center rounded-pill", badge)}>
								<StatusIcon kind={icon} animate className="size-5" />
							</span>
							<span className="font-display text-lg font-semibold text-ink">{word}</span>
						</div>

						{/* 30rem of content at sm+ (34rem sheet − 2 × 2rem padding). */}
						<m.div
							variants={contentStagger}
							className={cn(
								"flex flex-col gap-4 px-4 pt-5 sm:px-8",
								!actions && "pb-[calc(1.5rem+env(safe-area-inset-bottom))]",
							)}
						>
							<m.h2
								ref={titleRef}
								id={titleId}
								tabIndex={-1}
								variants={fadeUp}
								className="type-title text-ink outline-none"
							>
								{title}
							</m.h2>
							{Children.toArray(children).map((child, index) => (
								<m.div key={(isValidElement(child) && child.key) || index} variants={fadeUp}>
									{child}
								</m.div>
							))}
							{actions && (
								<m.div
									variants={fadeUp}
									className={cn(
										"sticky bottom-0 -mx-4 mt-1 flex flex-col gap-3 border-t border-line bg-surface-raised",
										"px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:-mx-8 sm:px-8",
									)}
								>
									{actions}
								</m.div>
							)}
						</m.div>
					</m.div>
				</div>
			)}
		</AnimatePresence>,
		document.body,
	);
}

export { ResultSheet, type ResultSheetProps, type ResultVerdict };
