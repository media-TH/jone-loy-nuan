"use client";

import { IconScan } from "@tabler/icons-react";
import { Button } from "@/components/ds/button";
import { TransitionLink } from "@/components/motion/scan-transition";
import { useQuizResultStore } from "@/store/quiz-store";
import { SurveyForm } from "./survey-form";

/**
 * The survey follows a finished quiz in this tab. The quiz store lives in memory only, so a
 * direct visit or a reload has no quiz to attach answers to: offer the quiz instead.
 */
export function SurveyContent() {
	const hasQuiz = useQuizResultStore((state) => state.responses.length > 0);

	if (!hasQuiz) {
		return (
			<section
				aria-labelledby="survey-empty-title"
				className="flex flex-col items-center gap-5 rounded-lg bg-surface-raised px-6 py-10 text-center shadow-raised"
			>
				<span aria-hidden className="grid size-14 place-items-center rounded-pill bg-brand-soft text-brand">
					<IconScan stroke={2.25} className="size-7" />
				</span>
				<div className="flex flex-col gap-2">
					<h1 id="survey-empty-title" className="type-title text-ink">
						ยังไม่มีแบบทดสอบที่ทำจบในแท็บนี้
					</h1>
					<p className="type-body text-ink-muted">
						แบบสอบถามนี้มาหลังแบบทดสอบ ลองสแกน 10 สถานการณ์ก่อน ใช้เวลาประมาณ 3 นาที
					</p>
				</div>
				<Button asChild variant="spark" size="lg" block>
					<TransitionLink href="/quiz">
						<IconScan aria-hidden stroke={2.25} />
						เริ่มสแกน
					</TransitionLink>
				</Button>
			</section>
		);
	}

	return (
		<>
			<div className="flex flex-col gap-2">
				<p className="type-label text-brand">แบบสอบถามสั้น ๆ · ไม่บังคับ</p>
				<h1 className="type-display-lg text-ink">ก่อนดูผลลัพธ์ ขอถามสั้น ๆ</h1>
				<p className="type-body-lg text-ink-muted">
					คำตอบช่วยให้เรารู้ว่าคนกลุ่มไหนควรได้รับความรู้เรื่องกลโกงแบบใดเพิ่ม
					และจะบันทึกก็ต่อเมื่อคุณเปิด “ยินยอม” ด้านล่างเท่านั้น
				</p>
			</div>
			<SurveyForm />
		</>
	);
}
