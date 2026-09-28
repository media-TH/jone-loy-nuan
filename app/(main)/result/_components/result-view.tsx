"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { IconBooks, IconRefresh } from "@tabler/icons-react";
import { Button } from "@/components/ds/button";
import type { RedFlag } from "@/components/ds/red-flag-pin";
import { RiskMeter } from "@/components/ds/risk-meter";
import { ScoreNumeral } from "@/components/ds/score-numeral";
import { TransitionLink } from "@/components/motion/scan-transition";
import { ShareActions } from "@/components/share/share-actions";
import { scoreShareText } from "@/components/share/share-links";
import { PRIVACY_PATH, PRIVACY_SECTION_IDS } from "@/lib/privacy/policy";
import { getRiskAssessment } from "@/lib/quiz/risk";
import { SHARE_TOTAL, shareScoreUrl } from "@/lib/seo/share";
import { SITE_NAME } from "@/lib/seo/site";
import { useQuizResultStore } from "@/store/quiz-store";
import { EmptyResult } from "./empty-result";
import { HelpLines } from "./help-lines";
import { MissedReview, type MissedQuestion } from "./missed-review";

/** Published content for one question, as much as the review needs (see ../page.tsx). */
export type ReviewQuestion = {
	id: string;
	order: number;
	category: string;
	/** Lesson headline (the question's result header); "" when the content has none. */
	title: string;
	redFlags: RedFlag[];
};

type ResultSnapshot = {
	score: number;
	total: number;
	/** Missed questions in quiz order, once each. */
	missed: ReadonlyArray<{ questionId: string; questionOrder: number }>;
};

/**
 * The finished quiz, read once when the page mounts. "ทำแบบทดสอบอีกครั้ง" resets the store
 * while the Scan Wipe is still covering this page; reading a snapshot keeps the page as it was
 * instead of flashing the empty state under the wipe. The store is in memory only, so the
 * server (and a reload) always sees null: no hydration mismatch.
 */
function readSnapshot(): ResultSnapshot | null {
	const { responses, getSummary } = useQuizResultStore.getState();
	if (responses.length === 0) return null;

	const { score, total } = getSummary();
	const seen = new Set<string>();
	const missed: { questionId: string; questionOrder: number }[] = [];
	for (const response of [...responses].sort((a, b) => a.questionOrder - b.questionOrder)) {
		if (seen.has(response.questionId)) continue;
		seen.add(response.questionId);
		if (!response.isCorrect) {
			missed.push({ questionId: response.questionId, questionOrder: response.questionOrder });
		}
	}
	return { score, total, missed };
}

const privacyLinkClass =
	"focus-ring rounded-xs font-semibold text-brand underline decoration-2 underline-offset-4 hover:decoration-4";

type ResultViewProps = {
	/** Content of the published quiz; empty when it could not be loaded. */
	questions: readonly ReviewQuestion[];
};

export function ResultView({ questions }: ResultViewProps) {
	const [snapshot] = useState(readSnapshot);
	const resetQuiz = useQuizResultStore((state) => state.resetQuiz);

	const missed = useMemo<MissedQuestion[]>(() => {
		if (!snapshot) return [];
		const byId = new Map(questions.map((question) => [question.id, question]));
		return snapshot.missed.map(({ questionId, questionOrder }) => {
			const content = byId.get(questionId);
			return {
				questionId,
				order: content?.order ?? questionOrder,
				category: content?.category ?? "",
				title: content?.title ?? "",
				redFlags: content?.redFlags ?? [],
			};
		});
	}, [questions, snapshot]);

	if (!snapshot) return <EmptyResult />;

	const risk = getRiskAssessment(snapshot.score, snapshot.total);

	return (
		<div className="flex flex-col gap-10">
			<section
				aria-labelledby="result-title"
				className="flex flex-col items-center gap-5 rounded-lg bg-surface-raised px-5 pt-6 pb-8 text-center shadow-raised"
			>
				<Image
					src={risk.illustration}
					alt={risk.illustrationAlt}
					width={1440}
					height={1080}
					loading="eager"
					sizes="18rem"
					className="h-auto w-full max-w-72"
				/>
				<div className="flex flex-col items-center gap-1">
					<p className="type-label text-ink-muted">คะแนนของคุณ</p>
					<ScoreNumeral value={snapshot.score} total={snapshot.total} />
				</div>
				<div className="flex flex-col gap-2">
					<h1 id="result-title" className="type-display-lg text-ink">
						{risk.title}
					</h1>
					<p className="type-body text-ink-muted">{risk.description}</p>
				</div>
				<RiskMeter level={risk.level} />
			</section>

			<section aria-labelledby="tips-title" className="flex flex-col gap-3">
				<h2 id="tips-title" className="type-title text-ink">
					จำไว้ใช้ในชีวิตจริง
				</h2>
				<ul className="type-body flex list-disc flex-col gap-2 pl-6 text-ink marker:text-brand">
					{risk.tips.map((tip) => (
						<li key={tip}>{tip}</li>
					))}
				</ul>
			</section>

			<MissedReview missed={missed} />

			<section aria-labelledby="share-title" className="flex flex-col gap-4">
				<div className="flex flex-col gap-1">
					<h2 id="share-title" className="type-title text-ink">
						ชวนคนรอบตัวมาสแกน
					</h2>
					<p className="type-body-sm text-ink-muted">
						ลิงก์ที่แชร์บอกแค่คะแนน {risk.scoreOutOfTen}/{SHARE_TOTAL} ไม่มีชื่อหรือคำตอบของคุณ
					</p>
				</div>
				<ShareActions
					url={shareScoreUrl(snapshot.score, snapshot.total)}
					title={SITE_NAME}
					text={scoreShareText(risk.scoreOutOfTen, SHARE_TOTAL)}
				/>
			</section>

			<div className="flex flex-col gap-3">
				<Button asChild variant="spark" size="lg" block>
					<TransitionLink href="/quiz" onClick={() => resetQuiz()}>
						<IconRefresh aria-hidden stroke={2.25} />
						ทำแบบทดสอบอีกครั้ง
					</TransitionLink>
				</Button>
				<Button asChild variant="quiet" size="md" block>
					<TransitionLink href="/learn">
						<IconBooks aria-hidden stroke={2.25} />
						เรียนรู้กลโกง
					</TransitionLink>
				</Button>
			</div>

			<HelpLines />

			<p className="type-body-sm text-ink-muted">
				ต้องการเปลี่ยนใจเรื่องข้อมูลของคุณ ทำได้เองที่หน้าประกาศความเป็นส่วนตัว:{" "}
				<Link href={`${PRIVACY_PATH}#${PRIVACY_SECTION_IDS.withdraw}`} className={privacyLinkClass}>
					ถอนความยินยอม
				</Link>{" "}
				หรือ{" "}
				<Link href={`${PRIVACY_PATH}#${PRIVACY_SECTION_IDS.erase}`} className={privacyLinkClass}>
					ลบข้อมูลของฉัน
				</Link>
			</p>
		</div>
	);
}
