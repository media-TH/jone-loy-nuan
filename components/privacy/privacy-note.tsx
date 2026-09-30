import Link from "next/link";
import { IconShieldLock } from "@tabler/icons-react";
import { PRIVACY_PATH } from "@/lib/privacy/policy";
import { cn } from "@/lib/utils";

type PrivacyNoteProps = {
	/**
	 * Open the notice in a new tab. Use it mid-quiz, so reading the notice never costs the answers
	 * given so far.
	 */
	newTab?: boolean;
	className?: string;
};

/**
 * PDPA s.23: the notice has to be offered before or at collection. Pages that collect while you
 * play (the quiz) or lead straight into it (the share page) carry this line, not only the landing
 * page's footer.
 */
export function PrivacyNote({ newTab = false, className }: PrivacyNoteProps) {
	return (
		<p className={cn("flex items-start gap-2 type-body-sm text-ink-muted", className)}>
			<IconShieldLock aria-hidden stroke={2.25} className="mt-0.5 size-[1.125rem] shrink-0" />
			<span>
				เราบันทึกคำตอบไว้กับรหัสสุ่มที่ไม่ระบุตัวตน ไม่ถามชื่อหรือเบอร์โทรศัพท์ อ่านรายละเอียดใน{" "}
				<Link
					href={PRIVACY_PATH}
					target={newTab ? "_blank" : undefined}
					className="focus-ring inline-flex min-h-11 items-center rounded-xs font-semibold text-brand underline decoration-2 underline-offset-4 hover:decoration-4"
				>
					ประกาศความเป็นส่วนตัว
					{newTab ? <span className="sr-only"> (เปิดในแท็บใหม่)</span> : null}
				</Link>
			</span>
		</p>
	);
}
