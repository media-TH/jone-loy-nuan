/**
 * 🎯 Session Service
 *
 * Modern functional approach for quiz session lifecycle management
 * Handles database quiz_sessions table operations
 */

import { createClient } from '@/utils/supabase/client';
import { getOrCreateAnonymousUser } from './anonymous-user.service';

export interface QuizSessionData {
  id: string;
  session_id: string;
  anonymous_user_id: string;
  total_questions: number;
  completed_questions: number;
  correct_answers: number;
  device_type: string;
  user_agent: string;
  screen_resolution: string;
  browser_info: string;
  is_completed: boolean;
  created_at: string;
  expires_at: string;
  completion_time_ms?: number;
  total_summary_score: number;
}

export interface SessionCreateOptions {
  totalQuestions: number;
  sessionId?: string;
}

export interface SessionUpdateData {
  completed_questions?: number;
  correct_answers?: number;
  is_completed?: boolean;
  completion_time_ms?: number;
  total_summary_score?: number;
}

// Session expires after 24 hours
const SESSION_EXPIRY_HOURS = 24;

/**
 * Generate unique session ID
 */
const generateSessionId = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `quiz_${timestamp}_${random}`;
};

/**
 * Calculate session expiry time
 */
const getSessionExpiryTime = (): string => {
  const expiryTime = new Date();
  expiryTime.setHours(expiryTime.getHours() + SESSION_EXPIRY_HOURS);
  return expiryTime.toISOString();
};

/**
 * Create new quiz session in database
 */
export const createQuizSession = async (
  options: SessionCreateOptions
): Promise<{ success: boolean; session?: QuizSessionData; error?: string }> => {
  try {
    const supabase = createClient();
    const anonymousUser = getOrCreateAnonymousUser();
    const sessionId = options.sessionId || generateSessionId();

    const sessionData = {
      session_id: sessionId,
      anonymous_user_id: anonymousUser.id,
      total_questions: options.totalQuestions,
      completed_questions: 0,
      correct_answers: 0,
      device_type: anonymousUser.device_info.type,
      user_agent: anonymousUser.device_info.user_agent,
      screen_resolution: anonymousUser.device_info.screen_resolution,
      browser_info: anonymousUser.device_info.browser_info,
      is_completed: false,
      expires_at: getSessionExpiryTime(),
      total_summary_score: 0
    };

    const { data, error } = await supabase
      .from('quiz_sessions')
      .insert(sessionData)
      .select()
      .single();

    if (error) {
      console.error('[SessionService] Failed to create session:', error);
      return {
        success: false,
        error: `Failed to create session: ${error.message}`
      };
    }

    return {
      success: true,
      session: data as QuizSessionData
    };

  } catch (error) {
    console.error('[SessionService] Create session error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Update existing quiz session
 */
export const updateQuizSession = async (
  sessionId: string,
  updateData: SessionUpdateData
): Promise<{ success: boolean; session?: QuizSessionData; error?: string }> => {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('quiz_sessions')
      .update(updateData)
      .eq('session_id', sessionId)
      .select()
      .single();

    if (error) {
      console.error('[SessionService] Failed to update session:', error);
      return {
        success: false,
        error: `Failed to update session: ${error.message}`
      };
    }

    return {
      success: true,
      session: data as QuizSessionData
    };

  } catch (error) {
    console.error('[SessionService] Update session error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Complete quiz session with final scores
 */
export const completeQuizSession = async (
  sessionId: string,
  completionData: {
    completion_time_ms: number;
    total_summary_score: number;
  }
): Promise<{ success: boolean; session?: QuizSessionData; error?: string }> => {
  try {
    const supabase = createClient();

    const updateData: SessionUpdateData = {
      ...completionData,
      is_completed: true
    };

    const { data, error } = await supabase
      .from('quiz_sessions')
      .update(updateData)
      .eq('session_id', sessionId)
      .select()
      .single();

    if (error) {
      console.error('[SessionService] Failed to complete session:', error);
      return {
        success: false,
        error: `Failed to complete session: ${error.message}`
      };
    }

    return {
      success: true,
      session: data as QuizSessionData
    };

  } catch (error) {
    console.error('[SessionService] Complete session error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Get quiz session by session ID
 */
export const getQuizSession = async (
  sessionId: string
): Promise<{ success: boolean; session?: QuizSessionData; error?: string }> => {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('quiz_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          success: false,
          error: 'Session not found'
        };
      }
      console.error('[SessionService] Failed to get session:', error);
      return {
        success: false,
        error: `Failed to get session: ${error.message}`
      };
    }

    return {
      success: true,
      session: data as QuizSessionData
    };

  } catch (error) {
    console.error('[SessionService] Get session error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Check if session is expired
 */
export const isSessionExpired = (session: QuizSessionData): boolean => {
  const expiryTime = new Date(session.expires_at).getTime();
  return Date.now() > expiryTime;
};

/**
 * Get active sessions for current anonymous user
 */
export const getActiveUserSessions = async (): Promise<{
  success: boolean;
  sessions?: QuizSessionData[];
  error?: string;
}> => {
  try {
    const supabase = createClient();
    const anonymousUserId = getOrCreateAnonymousUser().id;

    const { data, error } = await supabase
      .from('quiz_sessions')
      .select('*')
      .eq('anonymous_user_id', anonymousUserId)
      .eq('is_completed', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[SessionService] Failed to get active sessions:', error);
      return {
        success: false,
        error: `Failed to get active sessions: ${error.message}`
      };
    }

    return {
      success: true,
      sessions: data as QuizSessionData[]
    };

  } catch (error) {
    console.error('[SessionService] Get active sessions error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Clean up expired sessions (utility function)
 */
export const cleanupExpiredSessions = async (): Promise<{
  success: boolean;
  deletedCount?: number;
  error?: string;
}> => {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('quiz_sessions')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .eq('is_completed', false)
      .select('id');

    if (error) {
      console.error('[SessionService] Failed to cleanup sessions:', error);
      return {
        success: false,
        error: `Failed to cleanup sessions: ${error.message}`
      };
    }

    return {
      success: true,
      deletedCount: data?.length || 0
    };

  } catch (error) {
    console.error('[SessionService] Cleanup sessions error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Grouped export for convenience
export const quizSession = {
  create: createQuizSession,
  update: updateQuizSession,
  complete: completeQuizSession,
  get: getQuizSession,
  getActive: getActiveUserSessions,
  isExpired: isSessionExpired,
  cleanup: cleanupExpiredSessions
} as const;