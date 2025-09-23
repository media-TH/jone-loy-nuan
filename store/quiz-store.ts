import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { getOrCreateAnonymousUser } from "@/lib/services/anonymous-user.service";
import { QuizService } from "@/lib/services/quiz.service";

// --- Simplified Data Types ---

interface QuizResponse {
	questionId: string;
	answerId: string | null;
	isCorrect: boolean;
	responseTimeMs: number;
	kpiCategoryId: string;
	questionOrder: number;
}

interface KPIScore {
	categoryId: string;
	correct: number;
	total: number;
	percentage: number;
}

// --- Simplified Store Definition ---

interface QuizResultState {
	// Core Session Data
	sessionId: string | null;
	databaseSessionId: string | null;
	anonymousUserId: string | null;

	// Quiz Progress
	totalQuestions: number;
	responses: QuizResponse[];

	// Performance Tracking
	quizStartTime: number | null;
	questionStartTime: number | null;

	// UI State
	isLoading: boolean;
	error: string | null;
}

interface QuizResultActions {
	// Core Actions
	startQuiz: (totalQuestions: number) => void;
	addResponse: (response: Omit<QuizResponse, 'responseTimeMs'>) => void;
	completeQuiz: () => Promise<void>;
	resetQuiz: () => void;
	saveQuizSummaryToApi: () => Promise<void>;

	// Utility Actions
	startQuestion: () => void;
	setError: (error: string | null) => void;
	setLoading: (loading: boolean) => void;

	// Computed Values
	getSummary: () => { score: number; total: number; percentage: number };
	getKPIScores: () => KPIScore[];
}

type QuizResultStore = QuizResultState & QuizResultActions;

const initialState: QuizResultState = {
	sessionId: null,
	databaseSessionId: null,
	anonymousUserId: null,
	totalQuestions: 0,
	responses: [],
	quizStartTime: null,
	questionStartTime: null,
	isLoading: false,
	error: null,
};

export const useQuizResultStore = create<QuizResultStore>()(
	devtools(
		(set, get) => ({
			...initialState,

			/**
			 * 🚀 Start Quiz Session
			 */
			startQuiz: (totalQuestions: number) => {
				const sessionId = `quiz_${Date.now()}_${Math.random()
					.toString(36)
					.substr(2, 9)}`;

				set({
					sessionId,
					totalQuestions,
					responses: [],
					quizStartTime: Date.now(),
					questionStartTime: Date.now(),
					error: null,
					isLoading: false
				});

				// Get device info to pass to the service
				const deviceInfo = QuizService.getDeviceInfo();

				// Create database session asynchronously using QuizService
				QuizService.createSession({
					totalQuestions,
					sessionId,
					userAgent: deviceInfo.userAgent,
					deviceType: deviceInfo.type,
				})
					.then(result => {
						if (result.success) {
							set({
								databaseSessionId: result.session?.id || null,
								anonymousUserId: getOrCreateAnonymousUser().id
							});
						} else {
							console.error('Failed to create database session:', result.message);
						}
					})
					.catch(error => {
						console.error('Error creating database session:', error);
					});
			},

			/**
			 * 📊 Start Question Timer
			 */
			startQuestion: () => {
				set({ questionStartTime: Date.now() });
			},

			/**
			 * 💾 Add Response with Auto-Update
			 */
			addResponse: (response: Omit<QuizResponse, 'responseTimeMs'>) => {
				const state = get();
				const responseTimeMs = state.questionStartTime
					? Date.now() - state.questionStartTime
					: 0;

				const fullResponse: QuizResponse = {
					...response,
					responseTimeMs
				};

				const newResponses = [...state.responses, fullResponse];
				const correctAnswers = newResponses.filter(r => r.isCorrect).length;

				set({ responses: newResponses });

				// Update database session asynchronously using QuizService
				if (state.sessionId) {
					QuizService.updateSession(state.sessionId, {
						completed_questions: newResponses.length,
						correct_answers: correctAnswers
					}).catch(error => {
						console.error('Failed to update session:', error);
					});
				}
			},

			/**
			 * 🏁 Complete Quiz
			 */
			completeQuiz: async () => {
				const state = get();
				set({ isLoading: true });

				try {
					if (!state.sessionId || !state.quizStartTime) {
						throw new Error('No active session to complete');
					}

					const completionTimeMs = Date.now() - state.quizStartTime;
					const correctAnswers = state.responses.filter(r => r.isCorrect).length;
					const totalSummaryScore = Math.round((correctAnswers / state.totalQuestions) * 100);

					const result = await QuizService.completeSession(state.sessionId, {
						completion_time_ms: completionTimeMs,
						total_summary_score: totalSummaryScore
					});

					if (!result.success) {
						throw new Error(result.message || 'Failed to complete session');
					}

					set({ isLoading: false });

				} catch (error) {
					console.error('Failed to complete quiz:', error);
					set({
						error: error instanceof Error ? error.message : 'Failed to complete quiz',
						isLoading: false
					});
				}
			},

			/**
			 * 🔄 Reset Quiz
			 */
			resetQuiz: () => {
				set(initialState);
			},

			/**
			 * 📈 Get Summary
			 */
			getSummary: () => {
				const { responses, totalQuestions } = get();
				const score = responses.filter(r => r.isCorrect).length;
				const total = totalQuestions > 0 ? totalQuestions : responses.length;
				const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
				return { score, total, percentage };
			},

			/**
			 * 🎯 Get KPI Scores
			 */
			getKPIScores: () => {
				const { responses } = get();
				const kpiMap = new Map<string, { correct: number; total: number }>();

				responses.forEach(response => {
					const existing = kpiMap.get(response.kpiCategoryId) || { correct: 0, total: 0 };
					kpiMap.set(response.kpiCategoryId, {
						correct: existing.correct + (response.isCorrect ? 1 : 0),
						total: existing.total + 1
					});
				});

				return Array.from(kpiMap.entries()).map(([categoryId, stats]) => ({
					categoryId,
					correct: stats.correct,
					total: stats.total,
					percentage: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0
				}));
			},

			/**
			 * ⚠️ Error Management
			 */
			setError: (error: string | null) => {
				set({ error });
			},

			/**
			 * ⏳ Loading State
			 */
			setLoading: (loading: boolean) => {
				set({ isLoading: loading });
			},

			/**
			 * 💾 Save Quiz Summary to API
			 * Saves all question responses to question_responses table
			 * Database triggers will automatically update quiz_sessions
			 */
			saveQuizSummaryToApi: async () => {
				const state = get();
				if (!state.databaseSessionId || !state.responses.length) {
					console.warn('[QuizStore] No database session ID or responses available');
					return;
				}

				try {
					set({ isLoading: true });

					// Prepare question responses for batch save
					const questionResponses = state.responses.map(response => ({
						quiz_session_id: state.databaseSessionId!,
						question_id: response.questionId,
						selected_answer_id: response.answerId,
						is_correct: response.isCorrect,
						response_time_ms: response.responseTimeMs,
						kpi_category: response.kpiCategoryId,
						question_order: response.questionOrder
					}));

					// Save to question_responses (triggers will update quiz_sessions)
					const { saveQuestionResponsesBatch } = await import('@/lib/actions/question-responses');
					const result = await saveQuestionResponsesBatch(questionResponses);

					if (!result.success) {
						throw new Error(result.message || 'Failed to save responses');
					}

					console.log(`[QuizStore] ${result.count} responses saved, quiz_sessions updated by trigger`);
					set({ isLoading: false });

				} catch (error) {
					console.error('[QuizStore] Failed to save quiz summary:', error);
					set({
						error: error instanceof Error ? error.message : 'Failed to save quiz summary',
						isLoading: false
					});
				}
			},
		}),
		{
			name: "quiz-store",
		}
	)
);