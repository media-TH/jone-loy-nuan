/**
 * 🔥 QuizService - Unified Quiz & Session Management
 * 
 * Centralized service for all quiz-related operations including:
 * - Session management
 * - Response tracking
 * - Device detection
 * - Error handling with retry logic
 */

import { createClient } from '@/utils/supabase/client';
import { getOrCreateAnonymousUser } from './anonymous-user.service';

// --- Types ---

export interface QuizResponseData {
  session_id: string;
  total_questions: number;
  correct_answers: number;
  device_fingerprint: string;
  anonymous_user_id: string;
}

export interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop';
  userAgent: string;
}

export interface QuizSessionData {
  id: string;
  session_id: string;
  anonymous_user_id: string;
  total_questions: number;
  completed_questions: number;
  correct_answers: number;
  device_type: string;
  user_agent: string;
  is_completed: boolean;
  created_at: string;
  expires_at: string;
  total_summary_score: number;
}

export interface SessionCreateOptions {
  totalQuestions: number;
  sessionId: string;
  userAgent: string;
  deviceType: string;
}

export interface SessionUpdateData {
  completed_questions?: number;
  correct_answers?: number;
  is_completed?: boolean;
  completion_time_ms?: number;
  total_summary_score?: number;
}

// --- Service Class ---

export class QuizService {
  private static pendingSubmissions = new Map<string, Promise<void>>();
  private static submittedSessions = new Set<string>();
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000;

  /**
   * Get device information for analytics
   */
  static getDeviceInfo(): DeviceInfo {
    if (typeof window === 'undefined') {
      return { type: 'desktop', userAgent: '' };
    }

    const width = window.innerWidth;
    let type: 'mobile' | 'tablet' | 'desktop' = 'desktop';

    if (width < 640) type = 'mobile';
    else if (width < 1024) type = 'tablet';

    return {
      type,
      userAgent: window.navigator.userAgent
    };
  }

  /**
   * Create new quiz session using RPC for immediate ID return
   */
  static async createSession(options: SessionCreateOptions): Promise<{
    success: boolean;
    session?: QuizSessionData;
    message?: string;
  }> {
    try {
      const supabase = createClient();
      const anonymousUser = getOrCreateAnonymousUser();
      
      // Guard-prefix anonymous_user_id
      const ensuredAnonymousId = anonymousUser.id.startsWith('user_') 
        ? anonymousUser.id 
        : `user_${anonymousUser.id}`;

      const { data, error } = await supabase.rpc('create_quiz_session', {
        p_session_id: options.sessionId,
        p_anonymous_user_id: ensuredAnonymousId,
        p_total_questions: options.totalQuestions,
        p_device_type: options.deviceType,
        p_user_agent: options.userAgent
      }).single();

      if (error) {
        // Throw error to be caught by the calling function/test
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error('Failed to create session: No data returned from RPC.');
      }

      return {
        success: true,
        session: data as QuizSessionData
      };

    } catch (error: unknown) {
      const err = error as Error;
      console.error('[QuizService] Create session error:', err.message);
      // This catch block now correctly handles errors thrown from the try block
      return {
        success: false,
        message: err.message || 'Failed to create session'
      };
    }
  }

  /**
   * Update existing quiz session
   */
  static async updateSession(
    sessionId: string,
    updateData: SessionUpdateData
  ): Promise<{ success: boolean; session?: QuizSessionData; error?: string }> {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('quiz_sessions')
        .update(updateData)
        .eq('session_id', sessionId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        session: data as QuizSessionData
      };

    } catch (error) {
      console.error('[QuizService] Update session error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update session'
      };
    }
  }

  /**
   * Complete quiz session
   */
  static async completeSession(
    sessionId: string,
    completionData: {
      completion_time_ms: number;
      total_summary_score: number;
    }
  ): Promise<{ success: boolean; session?: Partial<QuizSessionData>; message?: string }> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('quiz_sessions')
        .update({
          is_completed: true,
          completed_at: new Date().toISOString(),
          ...completionData,
        })
        .eq('session_id', sessionId)
        .select('id, is_completed, total_summary_score')
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        session: data
      };

    } catch (error: unknown) {
      const err = error as Error;
      console.error('[QuizService] Complete session error:', err.message);
      return {
        success: false,
        message: err.message || 'Failed to complete session'
      };
    }
  }

  /**
   * Submit quiz response with deduplication and retry logic
   */
  static async submitQuizResponse(data: QuizResponseData): Promise<void> {
    const { session_id } = data;

    // Deduplication check
    if (this.submittedSessions.has(session_id)) {
      return;
    }

    // Prevent concurrent submissions
    const existingPromise = this.pendingSubmissions.get(session_id);
    if (existingPromise) {
      return existingPromise;
    }

    // Create submission promise with retry logic
    const submissionPromise = this.performSubmissionWithRetry(data);
    this.pendingSubmissions.set(session_id, submissionPromise);

    try {
      await submissionPromise;
      this.submittedSessions.add(session_id);
    } finally {
      this.pendingSubmissions.delete(session_id);
    }
  }

  /**
   * Internal method with retry logic
   */
  private static async performSubmissionWithRetry(
    data: QuizResponseData,
    attempt: number = 1
  ): Promise<void> {
    try {
      const { saveQuizResponse } = await import('@/lib/actions/quiz');
      const result = await saveQuizResponse(data);

      if (!result.success) {
        throw new Error(`Quiz submission failed: ${result.message || 'Unknown error'}`);
      }
    } catch (error) {
      if (attempt < this.MAX_RETRIES) {
        console.warn(`[QuizService] Submission attempt ${attempt} failed, retrying...`, error);
        await this.delay(this.RETRY_DELAY * attempt);
        return this.performSubmissionWithRetry(data, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Get quiz session by ID
   */
  static async getSession(sessionId: string): Promise<{
    success: boolean;
    session?: QuizSessionData;
    error?: string;
  }> {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('quiz_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { success: false, error: 'Session not found' };
        }
        throw error;
      }

      return {
        success: true,
        session: data as QuizSessionData
      };

    } catch (error) {
      console.error('[QuizService] Get session error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get session'
      };
    }
  }

  /**
   * Retries an async action a specified number of times with a delay.
   * @param action The async function to retry.
   * @param maxRetries The maximum number of retries.
   * @param delay The delay between retries in milliseconds.
   * @returns The result of the action if successful.
   */
  static async retryAction<T>(
    action: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 100
  ): Promise<T> {
    let lastError: unknown;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await action();
      } catch (error) {
        lastError = error;
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    throw lastError;
  }

  /**
   * Clears the submission cache.
   */
  static clearSubmissionCache(): void {
    this.pendingSubmissions.clear();
    this.submittedSessions.clear();
  }

  /**
   * Utility method to delay execution.
   * @param ms The delay time in milliseconds.
   * @returns A promise that resolves after the specified delay.
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}