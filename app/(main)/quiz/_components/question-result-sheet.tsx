"use client";

import { IconArrowRight } from "@tabler/icons-react";
import { Button } from "@/components/ds/button";
import { RedFlagList } from "@/components/ds/red-flag-pin";
import { ResultSheet } from "@/components/ds/result-sheet";
import type { Question } from "@/lib/content/types";

export const RESULT_SHEET_TITLE_ID = "quiz-result-title";

/** Same words as the sheet's verdict band, so the announcement matches what is on screen. */
const VERDICT_WORD = { correct: "ถูกต้อง", wrong: "โดนหลอกแล้ว" } as const;

function resultTitle(question: Question, isCorrect: boolean): string {
	const authored = (isCorrect ? question.result.correctTitle : question.result.wrongTitle).trim();
	if (authored) return authored;
	if (isCorrect) return "คุณสังเกตเห็นกลโกงนี้";
	const flags = question.redFlags.length;
	return flags > 0 ? `ข้อนี้มีธงแดง ${flags} จุด` : "ข้อนี้มีกลลวงซ่อนอยู่";
}

/** The label of the action that moves on (the sheet's spark button and the page's continue bar). */
export function nextActionLabel(isLastQuestion: boolean, isFinishing: boolean): string {
	if (isFinishing) return "กำลังบันทึกผล…";
	return isLastQuestion ? "ดูผลลัพธ์" : "ข้อต่อไป";
}

type QuestionResultSheetProps = {
	question: Question;
	open: boolean;
	isCorrect: boolean;
	isLastQuestion: boolean;
	isFinishing: boolean;
	onNext: () => void;
	/** Closes the sheet so the player can look at the revealed scenario again. */
	onDismiss: () => void;
};

/**
 * The answer's verdict, the result copy and the question's red flags, with one spark action to
 * move on. Focus lands on the title when it opens (ResultSheet), and the title carries the
 * verdict word for screen readers.
 */
export function QuestionResultSheet({
	question,
	open,
	isCorrect,
	isLastQuestion,
	isFinishing,
	onNext,
	onDismiss,
}: QuestionResultSheetProps) {
	const verdict = isCorrect ? "correct" : "wrong";
	const title = resultTitle(question, isCorrect);
	const verdictWord = VERDICT_WORD[verdict];
	const header = question.result.header.trim();
	const explanation = question.result.explanation.trim();
	const category = question.category.trim();
	const flags = question.redFlags;

	return (
		<ResultSheet
			open={open}
			verdict={verdict}
			labelledById={RESULT_SHEET_TITLE_ID}
			title={
				<>
					{!title.startsWith(verdictWord) && <span className="sr-only">{verdictWord}: </span>}
					{title}
				</>
			}
			onDismiss={isFinishing ? undefined : onDismiss}
			actions={
				<>
					<Button
						type="button"
						variant="spark"
						size="lg"
						block
						onClick={onNext}
						aria-disabled={isFinishing || undefined}
						aria-busy={isFinishing || undefined}
						className="aria-disabled:cursor-progress aria-disabled:opacity-70"
					>
						{nextActionLabel(isLastQuestion, isFinishing)}
						{!isFinishing && <IconArrowRight aria-hidden stroke={2.25} />}
					</Button>
					{!isFinishing && (
						<Button type="button" variant="link" size="md" onClick={onDismiss} className="self-center">
							ย้อนดูสถานการณ์
						</Button>
					)}
				</>
			}
		>
			{category ? (
				<p className="type-body-sm text-ink-muted">
					กลโกง: <span className="font-semibold text-ink">{category}</span>
				</p>
			) : null}
			{header ? <p className="type-body-lg font-semibold text-ink">{header}</p> : null}
			{explanation ? <p className="type-body text-ink">{explanation}</p> : null}
			{flags.length > 0 && (
				<section aria-labelledby="quiz-result-flags" className="flex flex-col gap-2">
					<h3 id="quiz-result-flags" className="type-label text-flag-text">
						ธงแดงที่ควรสังเกต {flags.length} จุด
					</h3>
					<RedFlagList flags={flags} />
				</section>
			)}
		</ResultSheet>
	);
}
