export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      answers: {
        Row: {
          answer_text: string
          created_at: string | null
          id: string
          is_correct: boolean
          question_id: string
        }
        Insert: {
          answer_text: string
          created_at?: string | null
          id?: string
          is_correct?: boolean
          question_id: string
        }
        Update: {
          answer_text?: string
          created_at?: string | null
          id?: string
          is_correct?: boolean
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "answer_distribution_analytics"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "most_correct_questions"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "most_wrong_questions"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_difficulty_analysis"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_performance_detailed"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      kpi_targets: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          kpi_category: string
          target_percentage: number
          total_questions: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          kpi_category: string
          target_percentage?: number
          total_questions: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          kpi_category?: string
          target_percentage?: number
          total_questions?: number
        }
        Relationships: []
      }
      question_responses: {
        Row: {
          answered_at: string | null
          id: string
          is_correct: boolean
          kpi_category: string
          question_id: string
          question_order: number
          quiz_session_id: string
          response_time_ms: number | null
          selected_answer_id: string | null
        }
        Insert: {
          answered_at?: string | null
          id?: string
          is_correct?: boolean
          kpi_category: string
          question_id: string
          question_order: number
          quiz_session_id: string
          response_time_ms?: number | null
          selected_answer_id?: string | null
        }
        Update: {
          answered_at?: string | null
          id?: string
          is_correct?: boolean
          kpi_category?: string
          question_id?: string
          question_order?: number
          quiz_session_id?: string
          response_time_ms?: number | null
          selected_answer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "question_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "answer_distribution_analytics"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "question_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "most_correct_questions"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "question_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "most_wrong_questions"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "question_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_difficulty_analysis"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "question_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_performance_detailed"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "question_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_responses_quiz_session_id_fkey"
            columns: ["quiz_session_id"]
            isOneToOne: false
            referencedRelation: "quiz_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_responses_quiz_session_id_fkey"
            columns: ["quiz_session_id"]
            isOneToOne: false
            referencedRelation: "user_session_analytics"
            referencedColumns: ["session_id"]
          },
          {
            foreignKeyName: "question_responses_quiz_session_id_fkey"
            columns: ["quiz_session_id"]
            isOneToOne: false
            referencedRelation: "user_statistics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_responses_selected_answer_id_fkey"
            columns: ["selected_answer_id"]
            isOneToOne: false
            referencedRelation: "answer_distribution_analytics"
            referencedColumns: ["answer_id"]
          },
          {
            foreignKeyName: "question_responses_selected_answer_id_fkey"
            columns: ["selected_answer_id"]
            isOneToOne: false
            referencedRelation: "answers"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          category: string | null
          content: Json | null
          created_at: string | null
          id: string
          kpi_category: string
          order_index: number
          question_text: string
          result: Json | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          content?: Json | null
          created_at?: string | null
          id?: string
          kpi_category: string
          order_index: number
          question_text: string
          result?: Json | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          content?: Json | null
          created_at?: string | null
          id?: string
          kpi_category?: string
          order_index?: number
          question_text?: string
          result?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      quiz_sessions: {
        Row: {
          anonymous_user_id: string | null
          completed_at: string | null
          completed_questions: number
          correct_answers: number
          created_at: string | null
          device_fingerprint: string | null
          device_type: string | null
          expires_at: string | null
          id: string
          is_completed: boolean | null
          session_id: string
          started_at: string | null
          total_questions: number
          total_summary_score: number | null
          user_agent: string | null
        }
        Insert: {
          anonymous_user_id?: string | null
          completed_at?: string | null
          completed_questions?: number
          correct_answers?: number
          created_at?: string | null
          device_fingerprint?: string | null
          device_type?: string | null
          expires_at?: string | null
          id?: string
          is_completed?: boolean | null
          session_id: string
          started_at?: string | null
          total_questions?: number
          total_summary_score?: number | null
          user_agent?: string | null
        }
        Update: {
          anonymous_user_id?: string | null
          completed_at?: string | null
          completed_questions?: number
          correct_answers?: number
          created_at?: string | null
          device_fingerprint?: string | null
          device_type?: string | null
          expires_at?: string | null
          id?: string
          is_completed?: boolean | null
          session_id?: string
          started_at?: string | null
          total_questions?: number
          total_summary_score?: number | null
          user_agent?: string | null
        }
        Relationships: []
      }
      red_flags: {
        Row: {
          created_at: string | null
          display_order: number | null
          flag_text: string
          flag_type: string | null
          id: string
          question_id: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          flag_text: string
          flag_type?: string | null
          id?: string
          question_id?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          flag_text?: string
          flag_type?: string | null
          id?: string
          question_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "red_flags_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "answer_distribution_analytics"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "red_flags_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "most_correct_questions"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "red_flags_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "most_wrong_questions"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "red_flags_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_difficulty_analysis"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "red_flags_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_performance_detailed"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "red_flags_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      scenario_images: {
        Row: {
          alt_text: string | null
          created_at: string | null
          display_order: number | null
          id: string
          image_url: string
          question_id: string
          variant: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url: string
          question_id: string
          variant: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string
          question_id?: string
          variant?: string
        }
        Relationships: [
          {
            foreignKeyName: "scenario_images_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "answer_distribution_analytics"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "scenario_images_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "most_correct_questions"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "scenario_images_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "most_wrong_questions"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "scenario_images_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_difficulty_analysis"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "scenario_images_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_performance_detailed"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "scenario_images_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_responses: {
        Row: {
          age_group: string
          education: string
          id: string
          internet_usage: string | null
          occupation: string
          province: string | null
          quiz_session_id: string | null
          submitted_at: string | null
        }
        Insert: {
          age_group: string
          education: string
          id?: string
          internet_usage?: string | null
          occupation: string
          province?: string | null
          quiz_session_id?: string | null
          submitted_at?: string | null
        }
        Update: {
          age_group?: string
          education?: string
          id?: string
          internet_usage?: string | null
          occupation?: string
          province?: string | null
          quiz_session_id?: string | null
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "survey_responses_quiz_session_id_fkey"
            columns: ["quiz_session_id"]
            isOneToOne: false
            referencedRelation: "quiz_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_responses_quiz_session_id_fkey"
            columns: ["quiz_session_id"]
            isOneToOne: false
            referencedRelation: "user_session_analytics"
            referencedColumns: ["session_id"]
          },
          {
            foreignKeyName: "survey_responses_quiz_session_id_fkey"
            columns: ["quiz_session_id"]
            isOneToOne: false
            referencedRelation: "user_statistics"
            referencedColumns: ["id"]
          },
        ]
      }
      user_statistics_backup_20250922: {
        Row: {
          accuracy_percentage: number | null
          anonymous_user_id: string | null
          browser: string | null
          completed_at: string | null
          completed_questions: number | null
          completion_time_minutes: number | null
          correct_answers: number | null
          created_at: string | null
          created_date: string | null
          created_hour: string | null
          day_of_week: number | null
          device_type: string | null
          hour_of_day: number | null
          id: string | null
          is_completed: boolean | null
          performance_level: string | null
          platform: string | null
          recency: string | null
          started_at: string | null
          total_questions: number | null
          total_summary_score: number | null
        }
        Insert: {
          accuracy_percentage?: number | null
          anonymous_user_id?: string | null
          browser?: number | null
          completed_at?: string | null
          completed_questions?: number | null
          completion_time_minutes?: number | null
          correct_answers?: number | null
          created_at?: string | null
          created_date?: string | null
          created_hour?: string | null
          day_of_week?: number | null
          device_type?: string | null
          hour_of_day?: number | null
          id?: string | null
          is_completed?: boolean | null
          performance_level?: string | null
          platform?: string | null
          recency?: string | null
          started_at?: string | null
          total_questions?: number | null
          total_summary_score?: number | null
        }
        Update: {
          accuracy_percentage?: number | null
          anonymous_user_id?: string | null
          browser?: string | null
          completed_at?: string | null
          completed_questions?: number | null
          completion_time_minutes?: number | null
          correct_answers?: number | null
          created_at?: string | null
          created_date?: string | null
          created_hour?: string | null
          day_of_week?: number | null
          device_type?: string | null
          hour_of_day?: number | null
          id?: string | null
          is_completed?: boolean | null
          performance_level?: string | null
          platform?: string | null
          recency?: string | null
          started_at?: string | null
          total_questions?: number | null
          total_summary_score?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      answer_distribution_analytics: {
        Row: {
          answer_id: string | null
          answer_text: string | null
          is_correct: boolean | null
          question_id: string | null
          question_text: string | null
          selection_percentage: number | null
          times_selected: number | null
        }
        Relationships: []
      }
      completion_analytics: {
        Row: {
          avg_score_completed: number | null
          completed_sessions: number | null
          completion_rate_percent: number | null
          incomplete_sessions: number | null
          total_sessions: number | null
          unique_users: number | null
        }
        Relationships: []
      }
      completion_by_time_analytics: {
        Row: {
          avg_completion_time_seconds: number | null
          completed_sessions: number | null
          completion_rate: number | null
          hour_of_day: number | null
          total_sessions: number | null
        }
        Relationships: []
      }
      daily_session_summary: {
        Row: {
          avg_completion_minutes: number | null
          avg_score: number | null
          completed_sessions: number | null
          session_date: string | null
          total_sessions: number | null
          unique_users: number | null
        }
        Relationships: []
      }
      demographics_analytics: {
        Row: {
          age_group: string | null
          avg_score: number | null
          avg_score_percentage: number | null
          education: string | null
          high_performers: number | null
          low_performers: number | null
          occupation: string | null
          total_responses: number | null
        }
        Relationships: []
      }
      device_platform_analytics: {
        Row: {
          avg_completion_time_seconds: number | null
          avg_score_percentage: number | null
          completed_sessions: number | null
          completion_rate: number | null
          device_type: string | null
          first_session: string | null
          last_session: string | null
          total_sessions: number | null
        }
        Relationships: []
      }
      kpi_category_analytics: {
        Row: {
          actual_percentage: number | null
          avg_response_time_ms: number | null
          correct_responses: number | null
          description: string | null
          display_name: string | null
          question_count: number | null
          slug: string | null
          target_percentage: number | null
          total_responses: number | null
          unique_users: number | null
          variance_from_target: number | null
        }
        Relationships: []
      }
      kpi_category_performance: {
        Row: {
          accuracy_percentage: number | null
          avg_response_time_ms: number | null
          correct_responses: number | null
          kpi_category: string | null
          total_responses: number | null
          unique_users: number | null
          wrong_responses: number | null
        }
        Relationships: []
      }
      kpi_performance_summary: {
        Row: {
          correct_responses: number | null
          kpi_category: string | null
          success_percentage: number | null
          total_responses: number | null
          unique_sessions: number | null
        }
        Relationships: []
      }
      most_correct_questions: {
        Row: {
          avg_response_time_ms: number | null
          correct_answers: number | null
          correct_percentage: number | null
          kpi_category: string | null
          order_index: number | null
          question_id: string | null
          question_text: string | null
          total_attempts: number | null
          wrong_answers: number | null
        }
        Relationships: []
      }
      most_wrong_questions: {
        Row: {
          avg_response_time_ms: number | null
          correct_answers: number | null
          kpi_category: string | null
          order_index: number | null
          question_id: string | null
          question_text: string | null
          total_attempts: number | null
          wrong_answers: number | null
          wrong_percentage: number | null
        }
        Relationships: []
      }
      overall_performance_summary: {
        Row: {
          correct_responses: number | null
          overall_percentage: number | null
          total_responses: number | null
          unique_sessions: number | null
        }
        Relationships: []
      }
      performance_trends: {
        Row: {
          avg_completion_time_seconds: number | null
          avg_score_percentage: number | null
          completed_sessions: number | null
          desktop_sessions: number | null
          mobile_sessions: number | null
          month_start: string | null
          quiz_date: string | null
          total_sessions: number | null
          unique_device_types: number | null
          week_start: string | null
        }
        Relationships: []
      }
      question_difficulty_analysis: {
        Row: {
          kpi_category: string | null
          order_index: number | null
          question_id: string | null
          question_text: string | null
          total_attempts: number | null
          wrong_count: number | null
          wrong_rate_percentage: number | null
        }
        Relationships: []
      }
      question_performance_detailed: {
        Row: {
          avg_response_time_ms: number | null
          correct_attempts: number | null
          kpi_category: string | null
          max_response_time_ms: number | null
          min_response_time_ms: number | null
          order_index: number | null
          question_id: string | null
          question_text: string | null
          stddev_response_time_ms: number | null
          success_rate: number | null
          total_attempts: number | null
          unique_users_attempted: number | null
        }
        Relationships: []
      }
      user_device_analytics: {
        Row: {
          avg_completion_minutes: number | null
          avg_score: number | null
          completed_sessions: number | null
          completion_rate_percent: number | null
          device_type: string | null
          total_sessions: number | null
          total_users: number | null
        }
        Relationships: []
      }
      user_session_analytics: {
        Row: {
          accuracy_percentage: number | null
          age_group: string | null
          anonymous_user_id: string | null
          avg_response_time_ms: number | null
          completed_questions: number | null
          completion_time_ms: number | null
          completion_time_seconds: number | null
          correct_answers: number | null
          created_at: string | null
          device_type: string | null
          education: string | null
          is_completed: boolean | null
          occupation: string | null
          session_id: string | null
          session_string: string | null
          survey_score: number | null
          total_questions: number | null
          total_responses: number | null
        }
        Relationships: []
      }
      user_statistics: {
        Row: {
          accuracy_percentage: number | null
          anonymous_user_id: string | null
          browser: string | null
          completed_at: string | null
          completed_questions: number | null
          completion_time_minutes: number | null
          correct_answers: number | null
          created_at: string | null
          created_date: string | null
          created_hour: string | null
          day_of_week: number | null
          device_type: string | null
          hour_of_day: number | null
          id: string | null
          is_completed: boolean | null
          performance_level: string | null
          platform: string | null
          recency: string | null
          started_at: string | null
          total_questions: number | null
          total_summary_score: number | null
        }
        Insert: {
          accuracy_percentage?: never
          anonymous_user_id?: string | null
          browser?: never
          completed_at?: string | null
          completed_questions?: number | null
          completion_time_minutes?: never
          correct_answers?: number | null
          created_at?: string | null
          created_date?: never
          created_hour?: never
          day_of_week?: never
          device_type?: string | null
          hour_of_day?: never
          id?: string | null
          is_completed?: boolean | null
          performance_level?: never
          platform?: never
          recency?: never
          started_at?: string | null
          total_questions?: number | null
          total_summary_score?: number | null
        }
        Update: {
          accuracy_percentage?: never
          anonymous_user_id?: string | null
          browser?: never
          completed_at?: string | null
          completed_questions?: number | null
          completion_time_minutes?: never
          correct_answers?: number | null
          created_at?: string | null
          created_date?: never
          created_hour?: never
          day_of_week?: never
          device_type?: string | null
          hour_of_day?: never
          id?: string | null
          is_completed?: boolean | null
          performance_level?: never
          platform?: never
          recency?: never
          started_at?: string | null
          total_questions?: number | null
          total_summary_score?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_kpi_scores: {
        Args: { session_uuid: string }
        Returns: {
          correct_answers: number
          kpi_category: string
          percentage: number
          total_questions: number
        }[]
      }
      calculate_total_summary_score: {
        Args: { session_uuid: string }
        Returns: number
      }
      cleanup_expired_sessions: { Args: never; Returns: number }
      create_quiz_session: {
        Args: {
          p_anonymous_user_id: string
          p_device_type: string
          p_session_id: string
          p_total_questions: number
          p_user_agent: string
        }
        Returns: {
          anonymous_user_id: string | null
          completed_at: string | null
          completed_questions: number
          correct_answers: number
          created_at: string | null
          device_fingerprint: string | null
          device_type: string | null
          expires_at: string | null
          id: string
          is_completed: boolean | null
          session_id: string
          started_at: string | null
          total_questions: number
          total_summary_score: number | null
          user_agent: string | null
        }
        SetofOptions: {
          from: "*"
          to: "quiz_sessions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      generate_completion_behavior: {
        Args: { device_fp: string }
        Returns: {
          completion_time_ms: number
          score: number
          should_complete: boolean
        }[]
      }
      generate_realistic_device_fingerprint: { Args: never; Returns: string }
      generate_realistic_timestamp: {
        Args: { days_back?: number }
        Returns: string
      }
      get_questions_with_answers: {
        Args: never
        Returns: {
          answers: Json
          category: string
          content: Json
          created_at: string
          id: string
          kpi_category: string
          order_index: number
          question_text: string
          result: Json
          updated_at: string
        }[]
      }
      get_quiz_session_with_responses: {
        Args: { session_uuid: string }
        Returns: {
          completed_questions: number
          correct_answers: number
          created_at: string
          is_completed: boolean
          responses: Json
          session_id: string
          total_questions: number
        }[]
      }
      purge_incomplete_zero_sessions: {
        Args: { retention_days?: number }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const