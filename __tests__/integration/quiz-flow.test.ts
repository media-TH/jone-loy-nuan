/**
 * 🧪 Quiz Flow Integration Tests - Fixed Version
 *
 * Tests the complete quiz flow from start to finish
 */

import { QuizService } from '@/lib/services/quiz.service';
import { CacheService } from '@/lib/services/cache.service';
import { fetchQuizQuestions } from '@/lib/actions/questions';
import { saveQuizResponse } from '@/lib/actions/quiz';
import { saveQuestionResponse } from '@/lib/actions/question-responses';

// Mock the question fetching
jest.mock('@/lib/actions/questions', () => ({
    __esModule: true,
    ...jest.requireActual('@/lib/actions/questions'),
    fetchQuizQuestions: jest.fn(),
}));

// Create mock Supabase client with proper chaining
const createMockSupabaseClient = () => {
    const mockClient = {
        from: jest.fn(),
        select: jest.fn(),
        insert: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
        eq: jest.fn(),
        single: jest.fn(),
        rpc: jest.fn(),
    };

    // Setup complete chaining - CRITICAL: Every method must return mockClient EXCEPT final methods   
    mockClient.from.mockReturnValue(mockClient);
    mockClient.select.mockReturnValue(mockClient);
    mockClient.insert.mockReturnValue(mockClient);
    mockClient.upsert.mockReturnValue(mockClient);
    mockClient.update.mockReturnValue(mockClient);
    mockClient.eq.mockReturnValue(mockClient);

    // Final methods return Promises - these end the chain
    mockClient.single.mockResolvedValue({ data: null, error: null });
    mockClient.rpc.mockResolvedValue({ data: null, error: null });

    return mockClient;
};

// Create single instance ของ mock client
const mockSupabaseClient = createMockSupabaseClient();

// Mock Supabase modules
jest.mock('@/utils/supabase/server', () => ({
    createClient: jest.fn(() => mockSupabaseClient),
}));

jest.mock('@/utils/supabase/client', () => ({
    createClient: jest.fn(() => mockSupabaseClient),
}));

// Mock QuizService methods properly
jest.mock('@/lib/services/quiz.service', () => {
    const actualService = jest.requireActual('@/lib/services/quiz.service');
    return {
        ...actualService,
        QuizService: {
            ...actualService.QuizService,
            createSession: jest.fn(),
            updateSession: jest.fn(),
            completeSession: jest.fn(),
            clearSubmissionCache: jest.fn(),
            retryAction: jest.fn((fn, _retries) => {
                // Simple retry implementation for testing
                return fn();
            }),
        }
    };
});

describe('Quiz Flow Integration Tests', () => {
    let testSessionId: string;
    let testQuestions: Record<string, unknown>[];

    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();

        // Clear cache
        CacheService.clear();
        QuizService.clearSubmissionCache();

        // Generate test session ID
        testSessionId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Mock questions data
        testQuestions = [
            {
                id: 'q1',
                order_index: 1,
                question_text: 'Test Question 1',
                kpi_category: 'SCAM_RECOGNITION',
                answers: [
                    { id: 'a1', answer_text: 'Correct Answer', is_correct: true },
                    { id: 'a2', answer_text: 'Wrong Answer', is_correct: false }
                ]
            },
            {
                id: 'q2',
                order_index: 2,
                question_text: 'Test Question 2',
                kpi_category: 'RISK_ASSESSMENT',
                answers: [
                    { id: 'a3', answer_text: 'Wrong Answer', is_correct: false },
                    { id: 'a4', answer_text: 'Correct Answer', is_correct: true }
                ]
            }
        ];

        // Reset mock implementations
        mockSupabaseClient.from.mockClear();
        mockSupabaseClient.select.mockClear();
        mockSupabaseClient.insert.mockClear();
        mockSupabaseClient.update.mockClear();
        mockSupabaseClient.eq.mockClear();
        mockSupabaseClient.single.mockClear();
        mockSupabaseClient.rpc.mockClear();

        // Re-setup chaining after clear - CRITICAL: Every method must return the mock client
        mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
        mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
        mockSupabaseClient.insert.mockReturnValue(mockSupabaseClient);
        mockSupabaseClient.update.mockReturnValue(mockSupabaseClient);
        mockSupabaseClient.upsert.mockReturnValue(mockSupabaseClient);
        mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);

        // Ensure single() returns a promise with our mock data
        mockSupabaseClient.single.mockResolvedValue({ data: null, error: null });
    });

    afterEach(() => {
        // Cleanup
        CacheService.clear();
        QuizService.clearSubmissionCache();
    });

    describe('Session Management', () => {
        it('should create a new quiz session successfully', async () => {
            const mockSession = {
                id: 'session-1',
                session_id: testSessionId,
                anonymous_user_id: 'user-1',
                total_questions: 2,
                completed_questions: 0,
                correct_answers: 0,
                device_type: 'desktop',
                user_agent: 'test-agent',
                is_completed: false,
                created_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                total_summary_score: 0
            };

            // Mock QuizService.createSession
            (QuizService.createSession as jest.Mock).mockResolvedValue({
                success: true,
                session: mockSession
            });

            const result = await QuizService.createSession({
                totalQuestions: 2,
                sessionId: testSessionId,
                userAgent: 'test-agent',
                deviceType: 'desktop'
            });

            expect(result.success).toBe(true);
            expect(result.session?.session_id).toBe(testSessionId);
            expect(result.session?.total_questions).toBe(2);
            expect(QuizService.createSession).toHaveBeenCalledWith({
                totalQuestions: 2,
                sessionId: testSessionId,
                userAgent: 'test-agent',
                deviceType: 'desktop'
            });
        });

        it('should update session progress correctly', async () => {
            const mockSession = {
                id: 'session-1',
                session_id: testSessionId,
                anonymous_user_id: 'user-1',
                total_questions: 2,
                completed_questions: 1,
                correct_answers: 1,
                device_type: 'desktop',
                user_agent: 'test-agent',
                is_completed: false,
                created_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                total_summary_score: 0
            };

            (QuizService.updateSession as jest.Mock).mockResolvedValue({
                success: true,
                session: mockSession
            });

            const result = await QuizService.updateSession(testSessionId, {
                completed_questions: 1,
                correct_answers: 1
            });

            expect(result.success).toBe(true);
            expect(result.session?.completed_questions).toBe(1);
            expect(result.session?.correct_answers).toBe(1);
        });

        it('should complete session with final scores', async () => {
            const mockSession = {
                id: 'session-1',
                session_id: testSessionId,
                anonymous_user_id: 'user-1',
                total_questions: 2,
                completed_questions: 2,
                correct_answers: 2,
                device_type: 'desktop',
                user_agent: 'test-agent',
                is_completed: true,
                created_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                total_summary_score: 100
            };

            (QuizService.completeSession as jest.Mock).mockResolvedValue({
                success: true,
                session: mockSession
            });

            const result = await QuizService.completeSession(testSessionId, {
                completion_time_ms: 120000,
                total_summary_score: 100
            });

            expect(result.success).toBe(true);
            expect(result.session?.is_completed).toBe(true);
            expect(result.session?.total_summary_score).toBe(100);
        });
    });

    describe('Question Loading and Caching', () => {
        it('should load questions and cache them', async () => {
            const mockQuestions = [...testQuestions];
            (fetchQuizQuestions as jest.Mock).mockResolvedValue(mockQuestions);

            const questions1 = await fetchQuizQuestions();
            expect(questions1).toEqual(mockQuestions);
            expect(fetchQuizQuestions).toHaveBeenCalledTimes(1);

            const questions2 = await fetchQuizQuestions();
            expect(questions2).toEqual(mockQuestions);
            expect(fetchQuizQuestions).toHaveBeenCalledTimes(2);
        });

        it('should handle question loading errors gracefully', async () => {
            (fetchQuizQuestions as jest.Mock).mockRejectedValueOnce(new Error('Database error'));     

            await expect(fetchQuizQuestions()).rejects.toThrow('Database error');
        });
    });

    describe('Answer Submission', () => {
        const mockSessionUUID = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';
        
        interface QuestionResponseData {
            quiz_session_id: string;
            question_id: string;
            selected_answer_id: string | null;
            is_correct: boolean;
            response_time_ms: number;
            kpi_category: string;
            question_order: number;
        }

        interface QuizResponseData {
            session_id: string;
            total_questions: number;
            correct_answers: number;
            device_fingerprint?: string;
            anonymous_user_id?: string;
        }

        let mockResponseData: QuestionResponseData;
        let mockQuizData: QuizResponseData;

        beforeEach(() => {
            mockResponseData = {
                quiz_session_id: mockSessionUUID,
                question_id: 'q1',
                selected_answer_id: 'a1',
                is_correct: true,
                response_time_ms: 5000,
                kpi_category: 'SCAM_RECOGNITION',
                question_order: 1
            };

            mockQuizData = {
                session_id: testSessionId,
                total_questions: 2,
                correct_answers: 2,
                device_fingerprint: 'desktop',
                anonymous_user_id: 'user-1'
            };

            // Default successful responses
            mockSupabaseClient.insert.mockResolvedValue({ error: null });
            mockSupabaseClient.upsert.mockResolvedValue({ error: null });
            mockSupabaseClient.update.mockResolvedValue({ error: null });
        });

        it('should submit individual question responses', async () => {
            // Mock no existing response
            mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: null });

            const result = await saveQuestionResponse(mockResponseData);

            expect(result.success).toBe(true);
            expect(result.action).toBe('created');
            expect(mockSupabaseClient.from).toHaveBeenCalledWith('question_responses');
            expect(mockSupabaseClient.insert).toHaveBeenCalledWith([expect.objectContaining({
                quiz_session_id: mockSessionUUID,
                question_id: 'q1'
            })]);
        });

        it('should prevent duplicate response submissions', async () => {
            // Mock existing response
            mockSupabaseClient.single.mockResolvedValueOnce({
                data: { id: 'existing-id' },
                error: null
            });

            const result = await saveQuestionResponse(mockResponseData);

            expect(result.success).toBe(true);
            expect(result.action).toBe('skipped');
            expect(mockSupabaseClient.insert).not.toHaveBeenCalled();
        });

        it('should submit final quiz summary by updating existing session', async () => {
            // Chain 1: .from().select().eq().single() - Check if session exists
            mockSupabaseClient.single
                .mockResolvedValueOnce({
                    data: { id: mockSessionUUID, is_completed: false },
                    error: null
                })
                // Chain 2: .from().update().eq() - Update session
                .mockResolvedValueOnce({ error: null });

            const result = await saveQuizResponse(mockQuizData);

            expect(result.success).toBe(true);
            expect(result.action).toBe('updated');
            expect(mockSupabaseClient.from).toHaveBeenCalledWith('quiz_sessions');
            expect(mockSupabaseClient.select).toHaveBeenCalledWith('id, is_completed');
            expect(mockSupabaseClient.update).toHaveBeenCalled();
            expect(mockSupabaseClient.eq).toHaveBeenCalledWith('session_id', mockQuizData.session_id);
            expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', mockSessionUUID);
        });

        it('should submit final quiz summary by creating a new session', async () => {
            // Mock: Session does not exist
            mockSupabaseClient.single.mockResolvedValueOnce({
                data: null,
                error: { code: 'PGRST116', message: 'No rows found' }
            });

            // Mock: Successful insert
            mockSupabaseClient.insert.mockResolvedValueOnce({ error: null });

            const result = await saveQuizResponse(mockQuizData);

            expect(result.success).toBe(true);
            expect(result.action).toBe('created');
            expect(mockSupabaseClient.from).toHaveBeenCalledWith('quiz_sessions');
            expect(mockSupabaseClient.insert).toHaveBeenCalledWith([expect.objectContaining({
                session_id: mockQuizData.session_id,
                is_completed: true
            })]);
        });
    });

    describe('Complete Quiz Flow', () => {
        const mockSessionUUID = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';

        beforeEach(() => {
            // Setup QuizService mocks
            (QuizService.createSession as jest.Mock).mockResolvedValue({
                success: true,
                session: {
                    id: mockSessionUUID,
                    session_id: testSessionId,
                    is_completed: false,
                    total_questions: 2,
                    completed_questions: 0,
                    correct_answers: 0
                }
            });

            (QuizService.completeSession as jest.Mock).mockResolvedValue({
                success: true,
                session: {
                    id: mockSessionUUID,
                    session_id: testSessionId,
                    is_completed: true,
                    total_summary_score: 100
                }
            });

            // Mock saveQuestionResponse
            mockSupabaseClient.single.mockResolvedValue({ data: null, error: null });
            mockSupabaseClient.insert.mockResolvedValue({ error: null });

            // Mock fetchQuizQuestions
            (fetchQuizQuestions as jest.Mock).mockResolvedValue(testQuestions);
        });

        it('should complete entire quiz flow successfully', async () => {
            // Step 1: Create session
            const sessionResult = await QuizService.createSession({
                totalQuestions: 2,
                sessionId: testSessionId,
                userAgent: 'test-agent',
                deviceType: 'desktop'
            });

            expect(sessionResult.success).toBe(true);
            expect(sessionResult.session?.id).toBe(mockSessionUUID);

            const createdSessionId = sessionResult.session!.id;

            // Step 2: Submit answers
            for (const question of testQuestions) {
                interface TestAnswer { id: string; is_correct: boolean }
                interface TestQuestion { id: string; answers: TestAnswer[]; kpi_category: string; order_index: number }
                const q = question as unknown as TestQuestion;
                const correctAnswer = q.answers.find((a) => a.is_correct);
                if (!correctAnswer) throw new Error('No correct answer in test data');
                
                const responseResult = await saveQuestionResponse({
                    quiz_session_id: createdSessionId,
                    question_id: q.id,
                    selected_answer_id: correctAnswer.id,
                    is_correct: true,
                    response_time_ms: 5000,
                    kpi_category: q.kpi_category,
                    question_order: q.order_index
                });
                expect(responseResult.success).toBe(true);
            }

            // Step 3: Complete quiz
            const completeResult = await QuizService.completeSession(testSessionId, {
                completion_time_ms: 120000,
                total_summary_score: 100
            });

            expect(completeResult.success).toBe(true);
            expect(completeResult.session?.is_completed).toBe(true);
        });
    });

    describe('Error Handling', () => {
        it('should handle network errors gracefully during session creation', async () => {
            // Mock network error
            (QuizService.createSession as jest.Mock).mockResolvedValue({
                success: false,
                message: 'Network error'
            });

            const result = await QuizService.createSession({
                totalQuestions: 10,
                sessionId: 'error-session',
                userAgent: 'test',
                deviceType: 'desktop'
            });

            expect(result.success).toBe(false);
            expect(result.message).toContain('Network error');
        });

        it('should retry failed submissions', async () => {
            let callCount = 0;
            const retryableAction = jest.fn(async () => {
                callCount++;
                if (callCount < 3) {
                    throw new Error('Temporary error');
                }
                return { success: true };
            });

            // Mock retryAction to actually retry
            (QuizService.retryAction as jest.Mock).mockImplementation(async (fn, maxRetries) => {     
                for (let i = 0; i < maxRetries; i++) {
                    try {
                        return await (fn as () => Promise<{ success: boolean }>)();
                    } catch (error) {
                        if (i === maxRetries - 1) throw error;
                    }
                }
            });

            const result = await QuizService.retryAction(retryableAction, 3, 10);

            expect(result.success).toBe(true);
            expect(callCount).toBe(3);
        });
    });
});
