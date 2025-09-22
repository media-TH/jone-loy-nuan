/**
 * 🔥 QuizService - Centralized API management
 * 
 * Solves the duplicate API calls problem by providing a single source of truth
 * for all quiz-related API operations with deduplication and error handling.
 */

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

export class QuizService {
  private static pendingSubmissions = new Map<string, Promise<void>>();
  private static submittedSessions = new Set<string>();
  
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
   * Submit quiz response with deduplication
   * Prevents multiple submissions for the same session
   */
  static async submitQuizResponse(data: QuizResponseData): Promise<void> {
    const { session_id } = data;
    
    // 🛡️ Deduplication: Check if already submitted
    if (this.submittedSessions.has(session_id)) {
      console.log(`[QuizService] Session ${session_id} already submitted, skipping`);
      return;
    }
    
    // 🛡️ Prevent concurrent submissions for same session
    const existingPromise = this.pendingSubmissions.get(session_id);
    if (existingPromise) {
      console.log(`[QuizService] Session ${session_id} submission in progress, waiting...`);
      return existingPromise;
    }
    
    // 🚀 Create new submission promise
    const submissionPromise = this._performSubmission(data);
    this.pendingSubmissions.set(session_id, submissionPromise);
    
    try {
      await submissionPromise;
      this.submittedSessions.add(session_id);
      console.log(`[QuizService] Session ${session_id} submitted successfully`);
    } finally {
      this.pendingSubmissions.delete(session_id);
    }
  }
  
  /**
   * Internal method to perform the actual submission using Server Action
   */
  private static async _performSubmission(data: QuizResponseData): Promise<void> {
    const { saveQuizResponse } = await import('@/lib/actions/quiz');
    
    const result = await saveQuizResponse(data);
    
    if (!result.success) {
      throw new Error(`Quiz submission failed: ${result.message || 'Unknown error'}`);
    }
  }
  
  /**
   * Clear submission cache (useful for testing or reset)
   */
  static clearSubmissionCache(): void {
    this.pendingSubmissions.clear();
    this.submittedSessions.clear();
  }
  
  /**
   * Check if a session has been submitted
   */
  static isSessionSubmitted(sessionId: string): boolean {
    return this.submittedSessions.has(sessionId);
  }
}