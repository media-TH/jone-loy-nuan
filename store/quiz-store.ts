import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { getOrCreateAnonymousUser } from "@/lib/services/anonymous-user.service";
import { createQuizSession, updateQuizSession, completeQuizSession, type QuizSessionData } from "@/lib/services/session.service";

// --- Enhanced Data Types ---

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

// --- Enhanced Store Definition ---

interface QuizResultState {
	// Session Management
	sessionId: string | null;
	databaseSessionId: string | null;
	anonymousUserId: string | null;

	// Quiz Data
	totalQuestions: number;
	currentQuestionIndex: number;
	responses: QuizResponse[];

	// Performance Tracking
	quizStartTime: number | null;
	questionStartTime: number | null;

	// KPI Tracking
	kpiScores: KPIScore[];

	// UI State
	isLoading: boolean;
	error: string | null;

	// Session Data
	sessionData: QuizSessionData | null;
}

interface QuizResultActions {
	// Session Management
	initializeQuiz: (totalQuestions: number) => Promise<void>;
	startQuestion: () => void;
	addResponse: (response: Omit<QuizResponse, 'responseTimeMs'>) => void;

	// KPI Management
	updateKPIScores: () => void;
	getKPIScore: (categoryId: string) => KPIScore | null;

	// Quiz Flow
	completeQuiz: () => Promise<void>;
	resetQuiz: () => void;

	// Utilities
	getSummary: () => { score: number; total: number; percentage: number };
	getCurrentProgress: () => { completed: number; total: number; percentage: number };

	// Error Handling
	setError: (error: string | null) => void;
	setLoading: (loading: boolean) => void;

	// Legacy Support (for backward compatibility)
	startQuiz: (totalQuestions: number) => void;
	saveQuizSummaryToApi: () => Promise<void>;
}

type QuizResultStore = QuizResultState & QuizResultActions;

const initialState: QuizResultState = {
	sessionId: null,
	databaseSessionId: null,
	anonymousUserId: null,
	totalQuestions: 0,
	currentQuestionIndex: 0,
	responses: [],
	quizStartTime: null,
	questionStartTime: null,
	kpiScores: [],
	isLoading: false,
	error: null,
	sessionData: null,
};

export const useQuizResultStore = create<QuizResultStore>()(
	devtools(
		(set, get) => ({
			...initialState,

			/**
			 * 🚀 Enhanced Quiz Initialization
			 * Creates database session and anonymous user tracking
			 */
			initializeQuiz: async (totalQuestions: number) => {
				set({ isLoading: true, error: null });

				try {
					// Get or create anonymous user
					const anonymousUser = getOrCreateAnonymousUser();

					// Generate session ID
					const sessionId = `quiz_${Date.now()}_${Math.random()
						.toString(36)
						.substr(2, 9)}`;

					// Create database session
					const sessionResult = await createQuizSession({
						totalQuestions,
						sessionId
					});

					if (!sessionResult.success) {
						throw new Error(sessionResult.error || 'Failed to create session');
					}

					set({
						sessionId,
						databaseSessionId: sessionResult.session?.id || null,
						anonymousUserId: anonymousUser.id,
						totalQuestions,
						currentQuestionIndex: 0,
						responses: [],
						quizStartTime: Date.now(),
						questionStartTime: Date.now(),
						sessionData: sessionResult.session || null,
						isLoading: false,
						error: null
					});

				} catch (error) {
					console.error('[QuizStore] Failed to initialize quiz:', error);
					set({
						error: error instanceof Error ? error.message : 'Failed to initialize quiz',
						isLoading: false
					});
				}
			},

			/**
			 * 📊 Start tracking for new question
			 */
			startQuestion: () => {
				set({ questionStartTime: Date.now() });
			},

			/**
			 * 💾 Enhanced Response Recording
			 * Records response with timing and updates database session
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
				const currentCorrectAnswers = newResponses.filter(r => r.isCorrect).length;

				set({
					responses: newResponses,
					currentQuestionIndex: state.currentQuestionIndex + 1
				});

				// Update KPI scores
				get().updateKPIScores();

				// Update database session
				if (state.sessionId) {
					updateQuizSession(state.sessionId, {
						completed_questions: newResponses.length,
						correct_answers: currentCorrectAnswers
					}).catch(error => {
						console.error('[QuizStore] Failed to update session:', error);
					});
				}
			},

			/**
			 * 🎯 KPI Score Calculation
			 */
			updateKPIScores: () => {
				const { responses } = get();
				const kpiMap = new Map<string, { correct: number; total: number }>();

				// Group responses by KPI category
				responses.forEach(response => {
					const existing = kpiMap.get(response.kpiCategoryId) || { correct: 0, total: 0 };
					kpiMap.set(response.kpiCategoryId, {
						correct: existing.correct + (response.isCorrect ? 1 : 0),
						total: existing.total + 1
					});
				});

				// Convert to KPI scores
				const kpiScores: KPIScore[] = Array.from(kpiMap.entries()).map(([categoryId, stats]) => ({
					categoryId,
					correct: stats.correct,
					total: stats.total,
					percentage: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0
				}));

				set({ kpiScores });
			},

			/**
			 * 📈 Get specific KPI score
			 */
			getKPIScore: (categoryId: string) => {
				const { kpiScores } = get();
				return kpiScores.find(score => score.categoryId === categoryId) || null;
			},

			/**
			 * 🏁 Complete Quiz with enhanced data
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

					// Complete database session
					await completeQuizSession(state.sessionId, {
						completion_time_ms: completionTimeMs,
						total_summary_score: totalSummaryScore
					});

					set({ isLoading: false });

				} catch (error) {
					console.error('[QuizStore] Failed to complete quiz:', error);
					set({
						error: error instanceof Error ? error.message : 'Failed to complete quiz',
						isLoading: false
					});
				}
			},

			/**
			 * 🔄 Reset Quiz State
			 */
			resetQuiz: () => {
				set(initialState);
			},

			/**
			 * 📊 Get Current Progress
			 */
			getCurrentProgress: () => {
				const { responses, totalQuestions } = get();
				const completed = responses.length;
				const percentage = totalQuestions > 0 ? Math.round((completed / totalQuestions) * 100) : 0;
				return { completed, total: totalQuestions, percentage };
			},

			/**
			 * 📈 Legacy Summary Method (for backward compatibility)
			 */
			getSummary: () => {
				const { responses, totalQuestions } = get();
				const score = responses.filter((r) => r.isCorrect).length;
				const total = totalQuestions > 0 ? totalQuestions : responses.length;
				const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
				return { score, total, percentage };
			},

			/**
			 * ⚠️ Error Management
			 */
			setError: (error: string | null) => {
				set({ error });
			},

			/**
			 * ⏳ Loading State Management
			 */
			setLoading: (loading: boolean) => {
				set({ isLoading: loading });
			},

			// --- Legacy Methods (for backward compatibility) ---

			/**
			 * 🔄 Legacy Start Quiz (for backward compatibility)
			 */
			startQuiz: (totalQuestions: number) => {
				const sessionId = `quiz_${Date.now()}_${Math.random()
					.toString(36)
					.substr(2, 9)}`;
				set({
					sessionId,
					totalQuestions,
					responses: [],
					currentQuestionIndex: 0,
					quizStartTime: Date.now()
				});
			},

			/**
			 * 💾 Legacy Save Method (for backward compatibility)
			 */
			saveQuizSummaryToApi: async () => {
				const { sessionId, responses, totalQuestions } = get();
				if (!sessionId) return;

				try {
					const correctAnswers = responses.filter((r) => r.isCorrect).length;
					const anonymousUser = getOrCreateAnonymousUser();

					// Use session service for consistency
					await updateQuizSession(sessionId, {
						correct_answers: correctAnswers,
						is_completed: true
					});

					console.log("Quiz summary saved successfully via enhanced store");
				} catch (error) {
					console.error("Failed to save quiz summary:", error);
				}
			},
		}),
		{
			name: "quiz-store",
		}
	)
);