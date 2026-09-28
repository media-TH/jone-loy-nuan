import { IconBooks, IconHome } from "@tabler/icons-react";
import { Button } from "@/components/ds/button";
import { TransitionLink } from "@/components/motion/scan-transition";
import { DEFAULT_QUIZ_SLUG, getContentSource } from "@/lib/content";
import { QuizClient } from "./_components/quiz-client";
import { QuizUnavailable } from "./_components/quiz-unavailable";

/**
 * /quiz — the published default quiz from the configured content source (Supabase, Contentful, or
 * the local fixture with CONTENT_SOURCE=fixture). Metadata and the Quiz JSON-LD live in ./layout.tsx.
 *
 * A source failure is not caught here on purpose: while regenerating, Next.js then keeps serving the
 * last good page instead of caching an error for an hour, and a first render that fails shows
 * ./error.tsx. A source that answers "no published quiz" gets the calm state below.
 */

// Same lifetime as the cached content itself (CONTENT_REVALIDATE_SECONDS).
export const revalidate = 3600;

export default async function QuizPage() {
	const quiz = await getContentSource().getQuiz(DEFAULT_QUIZ_SLUG);

	if (!quiz || quiz.questions.length === 0) {
		return (
			<QuizUnavailable
				title="ยังไม่มีแบบทดสอบให้เล่นในตอนนี้"
				description="เรากำลังเตรียมสถานการณ์จำลองชุดใหม่ ลองกลับมาอีกครั้งภายหลัง ระหว่างนี้คุณอ่านวิธีสังเกตกลโกงยอดฮิตได้ก่อน"
				actions={
					<>
						<Button asChild variant="spark" size="lg" block>
							<TransitionLink href="/learn">
								<IconBooks aria-hidden stroke={2.25} />
								เรียนรู้กลโกงยอดฮิต
							</TransitionLink>
						</Button>
						<Button asChild variant="quiet" size="md" block>
							<TransitionLink href="/">
								<IconHome aria-hidden stroke={2.25} />
								กลับหน้าแรก
							</TransitionLink>
						</Button>
					</>
				}
			/>
		);
	}

	return <QuizClient questions={quiz.questions} />;
}
