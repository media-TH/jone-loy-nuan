"use client";

/**
 * Self-service PDPA controls on the privacy notice:
 * - WithdrawConsent: withdraw the demographics consent (s.19) — one press, as easy as giving it.
 * - DeleteMyData: erase everything linked to this tab's anonymous id (s.33), after an in-page
 *   confirmation step (no window.confirm), then clear this browser's copy.
 *
 * Results are announced in a status line (word + icon + tone) that stays mounted, so screen readers
 * pick up every change. No motion: these are not among the animated moments.
 */

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { IconHandOff, IconTrash } from "@tabler/icons-react";
import { Button } from "@/components/ds/button";
import { StatusIcon } from "@/components/ds/status-icon";
import { eraseMyData, withdrawConsent } from "@/lib/actions/privacy";
import { clearClientStorage } from "@/lib/privacy/client-storage";
import { ANON_TOKEN_TTL_HOURS, RETENTION } from "@/lib/privacy/policy";
import type { ConsentActionResult, EraseMyDataResult } from "@/lib/privacy/types";
import { clearAnonToken, getCachedAnonToken } from "@/lib/services/anon-jwt.service";
import { cn } from "@/lib/utils";
import { useQuizResultStore } from "@/store/quiz-store";

type Status = {
	tone: "safe" | "caution";
	title: string;
	text: string;
};

const OFFLINE_MESSAGE = "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองอีกครั้ง";

function StatusLine({ status }: { status: Status | null }) {
	return (
		<p
			role="status"
			className={cn(
				"flex items-start gap-2 rounded-sm",
				// Always mounted (live regions must exist before they change); takes no space when empty.
				status && "mt-3 p-3",
				status?.tone === "safe" && "bg-safe-soft",
				status?.tone === "caution" && "bg-caution-soft",
			)}
		>
			{status ? (
				<>
					<StatusIcon
						kind={status.tone === "safe" ? "check" : "alert"}
						className={status.tone === "safe" ? "text-safe" : "text-caution-text"}
					/>
					<span className="type-body min-w-0 text-ink">
						<strong className="font-semibold">{status.title}</strong> {status.text}
					</span>
				</>
			) : null}
		</p>
	);
}

export function WithdrawConsent() {
	const [status, setStatus] = useState<Status | null>(null);
	const [isPending, startTransition] = useTransition();

	function withdraw() {
		setStatus(null);
		startTransition(async () => {
			const token = getCachedAnonToken()?.token;
			if (!token) {
				// No token = we cannot tell which rows are this person's. Say so; never claim none exist.
				setStatus({
					tone: "caution",
					title: "ถอนจากแท็บนี้ไม่ได้",
					text: `ไม่พบรหัสผู้ใช้ที่ยังใช้งานได้ในแท็บนี้ (ปิดแท็บไปแล้ว หรือเกิน ${ANON_TOKEN_TTL_HOURS} ชั่วโมง) ถ้าคุณเคยให้ข้อมูลประชากรไว้ ข้อมูลนั้นยังอยู่ แต่เราจับคู่กับคุณจากที่นี่ไม่ได้แล้ว ระบบจะลบเองเมื่อครบ ${RETENTION.demographics.months} เดือน หรือติดต่อผู้ควบคุมข้อมูลตามหัวข้อแรก`,
				});
				return;
			}

			let result: ConsentActionResult;
			try {
				result = await withdrawConsent({ token, purpose: "demographics" });
			} catch {
				result = { ok: false, code: "server_error", message: OFFLINE_MESSAGE };
			}

			setStatus(
				result.ok
					? { tone: "safe", title: "เรียบร้อย", text: result.message }
					: { tone: "caution", title: "ยังถอนไม่สำเร็จ", text: result.message },
			);
		});
	}

	return (
		<div className="flex flex-col">
			<Button
				type="button"
				variant="brand"
				className="self-start"
				onClick={withdraw}
				disabled={isPending}
				aria-busy={isPending || undefined}
			>
				<IconHandOff aria-hidden stroke={2.25} />
				{isPending ? "กำลังถอนความยินยอม…" : "ถอนความยินยอม"}
			</Button>
			<StatusLine status={status} />
		</div>
	);
}

export function DeleteMyData() {
	const [confirming, setConfirming] = useState(false);
	const [status, setStatus] = useState<Status | null>(null);
	const [isPending, startTransition] = useTransition();
	const triggerRef = useRef<HTMLButtonElement>(null);
	const confirmTitleRef = useRef<HTMLHeadingElement>(null);
	const returnFocusToTrigger = useRef(false);
	const confirmTitleId = useId();
	const confirmTextId = useId();

	// Opening moves focus into the confirmation; closing (cancel or done) brings it back.
	useEffect(() => {
		if (confirming) {
			confirmTitleRef.current?.focus();
		} else if (returnFocusToTrigger.current) {
			returnFocusToTrigger.current = false;
			triggerRef.current?.focus();
		}
	}, [confirming]);

	function open() {
		setStatus(null);
		setConfirming(true);
	}

	function close() {
		returnFocusToTrigger.current = true;
		setConfirming(false);
	}

	function erase() {
		startTransition(async () => {
			let result: EraseMyDataResult;
			try {
				result = await eraseMyData({ token: getCachedAnonToken()?.token ?? null });
			} catch {
				result = { ok: false, code: "server_error", message: OFFLINE_MESSAGE };
			}

			if (result.ok) {
				// Only now: the token is what proves who we are, so a failed attempt must keep it.
				clearClientStorage(result.clearLocalKeys);
				clearAnonToken();
				useQuizResultStore.getState().resetQuiz();
				setStatus({ tone: "safe", title: "ลบข้อมูลแล้ว", text: result.message });
			} else {
				setStatus({ tone: "caution", title: "ยังลบไม่สำเร็จ", text: result.message });
			}
			close();
		});
	}

	return (
		<div className="flex flex-col">
			{confirming ? (
				<div
					role="group"
					aria-labelledby={confirmTitleId}
					aria-describedby={confirmTextId}
					className="flex flex-col gap-4 rounded-md border-2 border-flag bg-flag-soft p-4 sm:p-5"
				>
					<h3
						id={confirmTitleId}
						ref={confirmTitleRef}
						tabIndex={-1}
						className="type-title focus-ring rounded-xs text-ink"
					>
						ยืนยันการลบข้อมูลของคุณ
					</h3>
					<div id={confirmTextId} className="flex flex-col gap-2">
						<p className="type-body text-ink">เราจะลบข้อมูลทุกอย่างที่ผูกกับรหัสสุ่มในแท็บนี้:</p>
						<ul className="type-body flex list-disc flex-col gap-1 pl-6 text-ink">
							<li>ผลแบบทดสอบและคำตอบทุกข้อ</li>
							<li>ข้อมูลประชากร ถ้าคุณเคยให้ไว้</li>
							<li>บันทึกการให้และถอนความยินยอม</li>
							<li>รหัสสุ่มและข้อมูลที่เก็บไว้ในเบราว์เซอร์นี้</li>
						</ul>
						<p className="type-body-sm text-ink-muted">
							ลบแล้วกู้คืนไม่ได้ ตัวเลขสถิติภาพรวมที่ไม่ระบุตัวตนและรวมไว้ก่อนหน้านี้แล้วจะไม่เปลี่ยน
						</p>
					</div>
					<div className="flex flex-col gap-3 sm:flex-row">
						<Button
							type="button"
							variant="flag"
							onClick={erase}
							disabled={isPending}
							aria-busy={isPending || undefined}
						>
							<IconTrash aria-hidden stroke={2.25} />
							{isPending ? "กำลังลบข้อมูล…" : "ยืนยัน ลบข้อมูล"}
						</Button>
						<Button type="button" variant="quiet" onClick={close} disabled={isPending}>
							ยกเลิก
						</Button>
					</div>
				</div>
			) : (
				<Button
					ref={triggerRef}
					type="button"
					variant="flag"
					className="self-start"
					onClick={open}
				>
					<IconTrash aria-hidden stroke={2.25} />
					ลบข้อมูลของฉัน
				</Button>
			)}
			<StatusLine status={status} />
		</div>
	);
}
