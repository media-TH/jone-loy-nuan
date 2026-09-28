import { RedFlagList, type RedFlag } from "@/components/ds/red-flag-pin";
import { StatusBadge } from "@/components/ds/status-badge";

/** One missed question as the review shows it. Content fields are empty when it is unknown. */
export type MissedQuestion = {
	questionId: string;
	/** 1-based position in the quiz. */
	order: number;
	/** Scam type, e.g. "แก๊งคอลเซ็นเตอร์". */
	category: string;
	/** The lesson headline from the question's result copy. */
	title: string;
	redFlags: readonly RedFlag[];
};

type MissedReviewProps = {
	missed: readonly MissedQuestion[];
};

/** "ข้อที่พลาด": each missed question with its title and numbered red flags, when the content has them. */
export function MissedReview({ missed }: MissedReviewProps) {
	return (
		<section aria-labelledby="missed-title" className="flex flex-col gap-4">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<h2 id="missed-title" className="type-title text-ink">
					ข้อที่พลาด
				</h2>
				{missed.length > 0 ? (
					<StatusBadge tone="flag">พลาด {missed.length} ข้อ</StatusBadge>
				) : (
					<StatusBadge tone="safe">ไม่พลาดเลย</StatusBadge>
				)}
			</div>

			{missed.length === 0 ? (
				<p className="type-body text-ink-muted">
					คุณจับพิรุธได้ทุกข้อที่ตอบ ลองส่งต่อวิธีสังเกตเหล่านี้ให้คนรอบตัว เพื่อให้ทุกคนรู้ทันไปด้วยกัน
				</p>
			) : (
				<>
					<p className="type-body text-ink-muted">
						ดูธงแดงของข้อที่พลาดอีกครั้ง ครั้งหน้าเจอของจริงจะจับพิรุธได้เร็วขึ้น
					</p>
					<ol role="list" className="flex flex-col gap-3">
						{missed.map((question) => (
							<MissedItem key={question.questionId} question={question} />
						))}
					</ol>
				</>
			)}
		</section>
	);
}

function MissedItem({ question }: { question: MissedQuestion }) {
	const { order, category, title, redFlags } = question;
	const number = `ข้อ ${order}`;
	const heading = title || category;
	const eyebrow = [number, title ? category : ""].filter(Boolean).join(" · ");

	return (
		<li className="flex flex-col gap-3 rounded-md bg-surface-raised p-4 shadow-raised">
			{heading ? (
				<div className="flex flex-col gap-1">
					<p className="type-label text-ink-muted">{eyebrow}</p>
					<h3 className="type-body-lg font-semibold text-ink">{heading}</h3>
				</div>
			) : (
				<h3 className="type-body-lg font-semibold text-ink">{number}</h3>
			)}
			{redFlags.length > 0 ? <RedFlagList flags={redFlags} /> : null}
		</li>
	);
}
