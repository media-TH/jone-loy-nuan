import { quizService } from "@/lib/services/quizService";

export const runRefreshQuizCacheJob = async () => {
	const quizzes = await quizService.getPublishedQuizzes();
	return {
		job: "refreshQuizCache",
		runsAt: new Date().toISOString(),
		quizzesProcessed: quizzes.length,
	};
};
