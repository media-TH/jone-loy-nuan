import { IconScan } from "@tabler/icons-react";
import { Button } from "@/components/ds/button";
import { TransitionLink } from "@/components/motion/scan-transition";

type QuizCtaProps = {
	title?: string;
	body?: string;
};

/** The one primary (spark) action on every learn page: go practise on the quiz. */
export function QuizCta({
	title = "ลองฝึกสังเกตธงแดงด้วยตัวเอง",
	body = "ดูสถานการณ์จำลอง 10 ข้อที่ใกล้เคียงชีวิตจริง ตัดสินใจ แล้วดูว่าธงแดงอยู่ตรงไหนบ้าง",
}: QuizCtaProps) {
	return (
		<section
			aria-labelledby="quiz-cta-title"
			className="flex flex-col items-start gap-4 rounded-lg bg-brand-soft p-6"
		>
			<div className="flex flex-col gap-1">
				<h2 id="quiz-cta-title" className="type-title text-ink">
					{title}
				</h2>
				<p className="type-body text-ink">{body}</p>
			</div>
			<Button asChild variant="spark" size="lg">
				<TransitionLink href="/quiz">
					<IconScan aria-hidden stroke={2.25} />
					ลองสแกนสถานการณ์จริง
				</TransitionLink>
			</Button>
		</section>
	);
}
