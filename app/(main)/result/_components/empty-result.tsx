import { IconBooks, IconScan } from "@tabler/icons-react";
import { Button } from "@/components/ds/button";
import { TransitionLink } from "@/components/motion/scan-transition";

/** Direct visit or reload: the quiz store is in memory only, so there is no result to show. */
export function EmptyResult() {
	return (
		<section
			aria-labelledby="result-empty-title"
			className="flex flex-col items-center gap-5 rounded-lg bg-surface-raised px-6 py-10 text-center shadow-raised"
		>
			<span aria-hidden className="grid size-14 place-items-center rounded-pill bg-brand-soft text-brand">
				<IconScan stroke={2.25} className="size-7" />
			</span>
			<div className="flex flex-col gap-2">
				<h1 id="result-empty-title" className="type-title text-ink">
					ยังไม่มีผลการสแกนในแท็บนี้
				</h1>
				<p className="type-body text-ink-muted">
					ผลลัพธ์จะแสดงหลังคุณทำแบบทดสอบจบ ถ้าเพิ่งรีเฟรชหน้าหรือเปิดลิงก์นี้ใหม่
					ผลรอบก่อนจะไม่แสดงที่นี่ ลองสแกนอีกรอบได้เลย ใช้เวลาประมาณ 3 นาที
				</p>
			</div>
			<div className="flex w-full flex-col gap-3">
				<Button asChild variant="spark" size="lg" block>
					<TransitionLink href="/quiz">
						<IconScan aria-hidden stroke={2.25} />
						เริ่มสแกน
					</TransitionLink>
				</Button>
				<Button asChild variant="quiet" size="md" block>
					<TransitionLink href="/learn">
						<IconBooks aria-hidden stroke={2.25} />
						เรียนรู้กลโกง
					</TransitionLink>
				</Button>
			</div>
		</section>
	);
}
