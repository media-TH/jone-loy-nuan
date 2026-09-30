"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import {
	IconBrandFacebook,
	IconBrandLine,
	IconCheck,
	IconCopy,
	IconShare,
} from "@tabler/icons-react";
import { Button } from "@/components/ds/button";
import { StatusBadge } from "@/components/ds/status-badge";
import { facebookShareHref, lineShareHref } from "@/components/share/share-links";
import { cn } from "@/lib/utils";

/**
 * Share a link: the phone's own share sheet (Web Share API) when the browser has one, plus
 * LINE, Facebook and copy-link, which work everywhere. Copying falls back to execCommand for
 * in-app browsers (LINE, Facebook) and, if that fails too, shows the link to copy by hand.
 * Every outcome is announced in a status line as a word + icon + colour.
 */

type CopyState = "idle" | "copied" | "failed";

/** How long "คัดลอกลิงก์แล้ว" stays before the copy button resets. */
const COPIED_MS = 4000;

const subscribeNothing = () => () => {};

function hasWebShare(): boolean {
	return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

/** false on the server and during hydration, so the server markup always matches. */
function useWebShare(): boolean {
	return useSyncExternalStore(subscribeNothing, hasWebShare, () => false);
}

/** execCommand("copy") through a throwaway textarea, for browsers without the async Clipboard API. */
function legacyCopy(text: string): boolean {
	const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
	const textarea = document.createElement("textarea");
	textarea.value = text;
	textarea.setAttribute("readonly", "");
	textarea.setAttribute("aria-hidden", "true");
	// 16px keeps iOS from zooming in on focus; fixed + transparent keeps the page from jumping.
	Object.assign(textarea.style, {
		position: "fixed",
		top: "0",
		left: "0",
		opacity: "0",
		fontSize: "16px",
		pointerEvents: "none",
	});
	document.body.appendChild(textarea);
	try {
		textarea.select();
		textarea.setSelectionRange(0, text.length);
		return document.execCommand("copy");
	} catch {
		return false;
	} finally {
		textarea.remove();
		previousFocus?.focus({ preventScroll: true });
	}
}

async function copyText(text: string): Promise<boolean> {
	if (window.isSecureContext && navigator.clipboard?.writeText) {
		try {
			await navigator.clipboard.writeText(text);
			return true;
		} catch {
			// Permission denied or unfocused document: try the older path below.
		}
	}
	return legacyCopy(text);
}

type ShareActionsProps = {
	/** Absolute URL to share, e.g. shareScoreUrl(score, total) from lib/seo/share. */
	url: string;
	/** Title for the native share sheet. */
	title: string;
	/** Message that goes with the link in the native share sheet. */
	text: string;
	className?: string;
};

function ShareActions({ url, title, text, className }: ShareActionsProps) {
	const webShare = useWebShare();
	const manualLinkId = useId();
	const [copyState, setCopyState] = useState<CopyState>("idle");
	const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(
		() => () => {
			if (resetTimer.current) clearTimeout(resetTimer.current);
		},
		[],
	);

	const handleNativeShare = async () => {
		try {
			await navigator.share({ title, text, url });
		} catch (error) {
			// AbortError = the share sheet was closed. Anything else: the other buttons still work.
			if (!(error instanceof DOMException && error.name === "AbortError")) {
				console.warn("[share] navigator.share failed", error);
			}
		}
	};

	const handleCopy = async () => {
		const copied = await copyText(url);
		if (resetTimer.current) clearTimeout(resetTimer.current);
		setCopyState(copied ? "copied" : "failed");
		if (copied) resetTimer.current = setTimeout(() => setCopyState("idle"), COPIED_MS);
	};

	const itemClass = "odd:last:col-span-2";
	const buttonClass = "px-4";

	return (
		<div data-slot="share-actions" className={cn("flex flex-col gap-3", className)}>
			<ul role="list" className="grid grid-cols-2 gap-2">
				{webShare ? (
					<li className={itemClass}>
						<Button type="button" variant="brand" block className={buttonClass} onClick={handleNativeShare}>
							<IconShare aria-hidden stroke={2.25} />
							แชร์
						</Button>
					</li>
				) : null}
				<li className={itemClass}>
					<Button asChild variant="quiet" block className={buttonClass}>
						<a href={lineShareHref(url)} target="_blank" rel="noopener noreferrer">
							<IconBrandLine aria-hidden stroke={2} />
							<span className="sr-only">แชร์ทาง</span>LINE
							<span className="sr-only"> (เปิดในแท็บใหม่)</span>
						</a>
					</Button>
				</li>
				<li className={itemClass}>
					<Button asChild variant="quiet" block className={buttonClass}>
						<a href={facebookShareHref(url)} target="_blank" rel="noopener noreferrer">
							<IconBrandFacebook aria-hidden stroke={2} />
							<span className="sr-only">แชร์ทาง</span>Facebook
							<span className="sr-only"> (เปิดในแท็บใหม่)</span>
						</a>
					</Button>
				</li>
				<li className={itemClass}>
					<Button type="button" variant="quiet" block className={buttonClass} onClick={handleCopy}>
						{copyState === "copied" ? (
							<IconCheck aria-hidden stroke={2.5} />
						) : (
							<IconCopy aria-hidden stroke={2.25} />
						)}
						{copyState === "copied" ? "คัดลอกแล้ว" : "คัดลอกลิงก์"}
					</Button>
				</li>
			</ul>

			<div role="status">
				{copyState === "copied" ? <StatusBadge tone="safe">คัดลอกลิงก์แล้ว</StatusBadge> : null}
				{copyState === "failed" ? (
					<div className="flex flex-col gap-2">
						<StatusBadge tone="caution" className="self-start">
							คัดลอกอัตโนมัติไม่ได้
						</StatusBadge>
						<label htmlFor={manualLinkId} className="type-body-sm text-ink-muted">
							กดค้างที่ลิงก์ด้านล่าง แล้วเลือกคัดลอก
						</label>
						<input
							id={manualLinkId}
							type="url"
							readOnly
							value={url}
							onFocus={(event) => event.currentTarget.select()}
							className="focus-ring h-12 w-full min-w-0 rounded-sm border-2 border-line-strong bg-surface-sunken px-4 type-body text-ink"
						/>
					</div>
				) : null}
			</div>
		</div>
	);
}

export { ShareActions, type ShareActionsProps };
