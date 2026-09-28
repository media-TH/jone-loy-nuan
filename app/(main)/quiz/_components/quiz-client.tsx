"use client";

import { IconArrowRight } from "@tabler/icons-react";
import { useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ds/button";
import { ProgressRail } from "@/components/ds/progress-rail";
import { preloadScenario, scenarioAnswersItself, ScenarioView } from "@/components/quiz/scenario-registry";
import { placedRedFlags } from "@/components/quiz/types";
import { useQuiz } from "@/hooks/useQuiz";
import type { Question } from "@/lib/content/types";
import { DUR, STAGGER } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";
import { AnswerList } from "./answer-list";
import { QuestionResultSheet } from "./question-result-sheet";

const QUESTION_HEADING_ID = "quiz-question";

/**
 * Beat between the answer and the result sheet: long enough for the answer feedback (Moment 4)
 * to finish and every pin to land (Moment 3) before the sheet's scrim covers the scenario.
 */
function sheetDelayMs(pinCount: number): number {
	return Math.round((DUR.slow + STAGGER.pins * Math.max(0, pinCount - 1)) * 1000);
}

type QuizClientProps = {
	questions: Question[];
};

/**
 * The quiz screen: progress rail → question → scenario → answers. Answering updates the options
 * and plants the red flags at once, then the result sheet rises; "ข้อต่อไป" moves on immediately
 * (the sheet exits while the next question's scenario is scanned in).
 */
export function QuizClient({ questions }: QuizClientProps) {
	const quiz = useQuiz(questions);
	const { question, index, total, response, sheet, openSheet } = quiz;
	const headingRef = useRef<HTMLHeadingElement>(null);
	const scenarioRef = useRef<HTMLDivElement>(null);
	const shownIndexRef = useRef(index);

	const answered = response !== null;
	const answersInScenario = scenarioAnswersItself(question.scenario);
	const placedFlags = useMemo(() => placedRedFlags(question.redFlags), [question.redFlags]);

	// The sheet rises once the answer feedback has played.
	useEffect(() => {
		if (!answered || sheet !== "closed") return;
		const timer = window.setTimeout(openSheet, sheetDelayMs(placedFlags.length));
		return () => window.clearTimeout(timer);
	}, [answered, sheet, openSheet, placedFlags.length]);

	// After advancing, start the new question from the top with focus on its heading.
	useEffect(() => {
		if (shownIndexRef.current === index) return;
		shownIndexRef.current = index;
		window.scrollTo(0, 0);
		headingRef.current?.focus({ preventScroll: true });
	}, [index]);

	// Warm the cache for the next question while this one is being played.
	const upcoming = questions[index + 1];
	useEffect(() => {
		if (upcoming) preloadScenario(upcoming.scenario);
	}, [upcoming]);

	// Closing the sheet is for looking at the revealed scenario, so bring it into view.
	useEffect(() => {
		if (sheet === "dismissed") scenarioRef.current?.scrollIntoView({ block: "start" });
	}, [sheet]);

	const showContinueBar = answered && sheet !== "closed";

	return (
		<main id="main" className="min-h-dvh bg-surface text-ink">
			<div
				className={cn(
					"mx-auto flex min-h-dvh w-full max-w-[30rem] flex-col gap-5 px-4 pt-4 sm:px-6 sm:pt-6",
					!showContinueBar && "pb-8",
				)}
			>
				<ProgressRail total={total} current={index} results={quiz.results} />

				<section aria-labelledby={QUESTION_HEADING_ID} className="flex flex-col gap-5">
					<h1
						id={QUESTION_HEADING_ID}
						ref={headingRef}
						tabIndex={-1}
						className="type-title text-ink outline-none"
					>
						{question.prompt}
					</h1>

					<div ref={scenarioRef} className="scroll-mt-4">
						<ScenarioView
							key={question.id}
							scenario={question.scenario}
							question={question}
							revealed={answered}
							scanKey={question.id}
							placedFlags={placedFlags}
							priority={index === 0}
							onAnswer={quiz.answerQuestion}
						/>
					</div>

					{!answersInScenario && (
						<AnswerList
							key={question.id}
							answers={question.answers}
							response={response}
							onSelect={quiz.selectAnswer}
							labelledBy={QUESTION_HEADING_ID}
						/>
					)}
				</section>

				{/* Behind the sheet while it is open; the way on after closing it to look again. */}
				{showContinueBar && (
					<div
						className={cn(
							"sticky bottom-0 z-(--layer-sticky) -mx-4 mt-auto flex gap-3 border-t border-line bg-surface-raised",
							"px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:-mx-6 sm:px-6",
						)}
					>
						<Button type="button" variant="quiet" size="md" onClick={openSheet} className="shrink-0">
							อ่านคำอธิบาย
						</Button>
						<Button type="button" variant="spark" size="md" block onClick={quiz.next}>
							{quiz.isLastQuestion ? "ดูผลลัพธ์" : "ข้อต่อไป"}
							<IconArrowRight aria-hidden stroke={2.25} />
						</Button>
					</div>
				)}
			</div>

			{response && (
				<QuestionResultSheet
					question={question}
					open={sheet === "open"}
					isCorrect={response.isCorrect}
					isLastQuestion={quiz.isLastQuestion}
					isFinishing={quiz.isFinishing}
					onNext={quiz.next}
					onDismiss={quiz.dismissSheet}
				/>
			)}
		</main>
	);
}
