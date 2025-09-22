export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      _quiz_session_map: {
        Row: {
          created_at: string | null
          fake_id: string
          session_id: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string | null
          fake_id?: string
          session_id: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string | null
          fake_id?: string
          session_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      answers: {
        Row: {
          answer_text: string
          created_at: string
          id: string
          is_correct: boolean
          question_id: string
          updated_at: string | null
        }
        Insert: {
          answer_text: string
          created_at?: string
          id?: string
          is_correct?: boolean
          question_id: string
          updated_at?: string | null
        }
        Update: {
          answer_text?: string
          created_at?: string
          id?: string
          is_correct?: boolean
          question_id?: string
          updated_at?: string | null
        }
        Relationships: [
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
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "user_wrong_answers"
            referencedColumns: ["question_id"]
          },
        ]
      }
      kpi_categories: {
        Row: {
          created_at: string
          description: string | null
          display_name: string
          id: string
          question_count: number
          slug: string
          target_percentage: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_name: string
          id?: string
          question_count?: number
          slug: string
          target_percentage?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          display_name?: string
          id?: string
          question_count?: number
          slug?: string
          target_percentage?: number
        }
        Relationships: []
      }
      kpi_target: {
        Row: {
          created_at: string
          description: string | null
          id: number
          kpi_category_id: string | null
          name: string
          period_end: string | null
          period_start: string | null
          quiz_session_id: string | null
          target_value: number | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: never
          kpi_category_id?: string | null
          name: string
          period_end?: string | null
          period_start?: string | null
          quiz_session_id?: string | null
          target_value?: number | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: never
          kpi_category_id?: string | null
          name?: string
          period_end?: string | null
          period_start?: string | null
          quiz_session_id?: string | null
          target_value?: number | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kpi_target_kpi_category_id_fkey"
            columns: ["kpi_category_id"]
            isOneToOne: false
            referencedRelation: "kpi_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpi_target_quiz_session_id_fkey"
            columns: ["quiz_session_id"]
            isOneToOne: false
            referencedRelation: "quiz_kpi_summary"
            referencedColumns: ["quiz_session_id"]
          },
          {
            foreignKeyName: "kpi_target_quiz_session_id_fkey"
            columns: ["quiz_session_id"]
            isOneToOne: false
            referencedRelation: "quiz_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      question_responses: {
        Row: {
          created_at: string
          device_type: string | null
          id: string
          is_correct: boolean
          kpi_category_id: string
          question_id: string | null
          question_order: number | null
          quiz_session_id: string | null
          response_time_ms: number | null
          selected_answer_id: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          device_type?: string | null
          id?: string
          is_correct: boolean
          kpi_category_id: string
          question_id?: string | null
          question_order?: number | null
          quiz_session_id?: string | null
          response_time_ms?: number | null
          selected_answer_id?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          device_type?: string | null
          id?: string
          is_correct?: boolean
          kpi_category_id?: string
          question_id?: string | null
          question_order?: number | null
          quiz_session_id?: string | null
          response_time_ms?: number | null
          selected_answer_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "question_responses_kpi_category_id_fkey"
            columns: ["kpi_category_id"]
            isOneToOne: false
            referencedRelation: "kpi_categories"
            referencedColumns: ["id"]
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
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "user_wrong_answers"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "question_responses_quiz_session_id_fkey"
            columns: ["quiz_session_id"]
            isOneToOne: false
            referencedRelation: "quiz_kpi_summary"
            referencedColumns: ["quiz_session_id"]
          },
          {
            foreignKeyName: "question_responses_quiz_session_id_fkey"
            columns: ["quiz_session_id"]
            isOneToOne: false
            referencedRelation: "quiz_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          content: Json | null
          created_at: string
          id: string
          kpi_category_id: string
          order_index: number | null
          question_text: string
          result: Json | null
          updated_at: string | null
        }
        Insert: {
          content?: Json | null
          created_at?: string
          id?: string
          kpi_category_id: string
          order_index?: number | null
          question_text: string
          result?: Json | null
          updated_at?: string | null
        }
        Update: {
          content?: Json | null
          created_at?: string
          id?: string
          kpi_category_id?: string
          order_index?: number | null
          question_text?: string
          result?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_kpi_category_id_fkey"
            columns: ["kpi_category_id"]
            isOneToOne: false
            referencedRelation: "kpi_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_responses: {
        Row: {
          correct_answers: number
          created_at: string
          device_type: string | null
          id: string
          quiz_session_id: string | null
          session_id: string
          total_questions: number
          user_agent: string | null
        }
        Insert: {
          correct_answers: number
          created_at?: string
          device_type?: string | null
          id?: string
          quiz_session_id?: string | null
          session_id: string
          total_questions: number
          user_agent?: string | null
        }
        Update: {
          correct_answers?: number
          created_at?: string
          device_type?: string | null
          id?: string
          quiz_session_id?: string | null
          session_id?: string
          total_questions?: number
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_responses_quiz_session_id_fkey"
            columns: ["quiz_session_id"]
            isOneToOne: false
            referencedRelation: "quiz_kpi_summary"
            referencedColumns: ["quiz_session_id"]
          },
          {
            foreignKeyName: "quiz_responses_quiz_session_id_fkey"
            columns: ["quiz_session_id"]
            isOneToOne: false
            referencedRelation: "quiz_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_responses_backup_20250920: {
        Row: {
          correct_answers: number | null
          created_at: string | null
          device_type: string | null
          id: string | null
          session_id: string | null
          total_questions: number | null
          user_agent: string | null
        }
        Insert: {
          correct_answers?: number | null
          created_at?: string | null
          device_type?: string | null
          id?: string | null
          session_id?: string | null
          total_questions?: number | null
          user_agent?: string | null
        }
        Update: {
          correct_answers?: number | null
          created_at?: string | null
          device_type?: string | null
          id?: string | null
          session_id?: string | null
          total_questions?: number | null
          user_agent?: string | null
        }
        Relationships: []
      }
      quiz_sessions: {
        Row: {
          anonymous_user_id: string | null
          browser_info: string | null
          completed_questions: number
          completion_time_ms: number | null
          correct_answers: number
          created_at: string
          device_type: string | null
          expires_at: string
          id: string
          is_completed: boolean
          screen_resolution: string | null
          session_id: string
          tmp_old_fake_id: number | null
          total_questions: number
          total_summary_score: number
          user_agent: string | null
        }
        Insert: {
          anonymous_user_id?: string | null
          browser_info?: string | null
          completed_questions?: number
          completion_time_ms?: number | null
          correct_answers?: number
          created_at?: string
          device_type?: string | null
          expires_at?: string
          id?: string
          is_completed?: boolean
          screen_resolution?: string | null
          session_id: string
          tmp_old_fake_id?: number | null
          total_questions?: number
          total_summary_score?: number
          user_agent?: string | null
        }
        Update: {
          anonymous_user_id?: string | null
          browser_info?: string | null
          completed_questions?: number
          completion_time_ms?: number | null
          correct_answers?: number
          created_at?: string
          device_type?: string | null
          expires_at?: string
          id?: string
          is_completed?: boolean
          screen_resolution?: string | null
          session_id?: string
          tmp_old_fake_id?: number | null
          total_questions?: number
          total_summary_score?: number
          user_agent?: string | null
        }
        Relationships: []
      }
      red_flags: {
        Row: {
          created_at: string
          flag_text: string
          id: string
          question_id: string | null
        }
        Insert: {
          created_at?: string
          flag_text: string
          id?: string
          question_id?: string | null
        }
        Update: {
          created_at?: string
          flag_text?: string
          id?: string
          question_id?: string | null
        }
        Relationships: [
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
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "red_flags_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "user_wrong_answers"
            referencedColumns: ["question_id"]
          },
        ]
      }
      scenario_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          question_id: string
          updated_at: string | null
          variant: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          question_id: string
          updated_at?: string | null
          variant: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          question_id?: string
          updated_at?: string | null
          variant?: string
        }
        Relationships: [
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
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scenario_images_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "user_wrong_answers"
            referencedColumns: ["question_id"]
          },
        ]
      }
      survey_responses: {
        Row: {
          age_group: string | null
          created_at: string
          education: string | null
          id: string
          occupation: string | null
          quiz_session_id: string | null
          total_questions: number
          total_score: number
        }
        Insert: {
          age_group?: string | null
          created_at?: string
          education?: string | null
          id?: string
          occupation?: string | null
          quiz_session_id?: string | null
          total_questions: number
          total_score: number
        }
        Update: {
          age_group?: string | null
          created_at?: string
          education?: string | null
          id?: string
          occupation?: string | null
          quiz_session_id?: string | null
          total_questions?: number
          total_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "survey_responses_quiz_session_id_fkey"
            columns: ["quiz_session_id"]
            isOneToOne: false
            referencedRelation: "quiz_kpi_summary"
            referencedColumns: ["quiz_session_id"]
          },
          {
            foreignKeyName: "survey_responses_quiz_session_id_fkey"
            columns: ["quiz_session_id"]
            isOneToOne: false
            referencedRelation: "quiz_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      question_difficulty_analysis: {
        Row: {
          avg_response_time_ms: number | null
          failure_rate: number | null
          kpi_category: string | null
          question_id: string | null
          question_text: string | null
          success_rate: number | null
          total_attempts: number | null
        }
        Relationships: []
      }
      question_responses_enriched: {
        Row: {
          created_at: string | null
          id: string | null
          is_correct: boolean | null
          kpi_category_slug: string | null
          question_id: string | null
          question_order: number | null
          quiz_session_id: string | null
          response_time_ms: number | null
          selected_answer_id: string | null
        }
        Relationships: [
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
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "user_wrong_answers"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "question_responses_quiz_session_id_fkey"
            columns: ["quiz_session_id"]
            isOneToOne: false
            referencedRelation: "quiz_kpi_summary"
            referencedColumns: ["quiz_session_id"]
          },
          {
            foreignKeyName: "question_responses_quiz_session_id_fkey"
            columns: ["quiz_session_id"]
            isOneToOne: false
            referencedRelation: "quiz_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_kpi_summary: {
        Row: {
          anonymous_user_id: string | null
          created_at: string | null
          overall_percentage: number | null
          protective_actions_percentage: number | null
          quiz_session_id: string | null
          response_strategies_percentage: number | null
          risk_assessment_percentage: number | null
          scam_recognition_percentage: number | null
          session_id: string | null
          total_answers_recorded: number | null
        }
        Relationships: []
      }
      user_kpi_performance: {
        Row: {
          accuracy_percentage: number | null
          anonymous_user_id: string | null
          avg_response_time_ms: number | null
          kpi_category: string | null
          questions_attempted: number | null
        }
        Relationships: []
      }
      user_wrong_answers: {
        Row: {
          anonymous_user_id: string | null
          kpi_category: string | null
          question_id: string | null
          question_text: string | null
          quiz_session_id: string | null
          session_id: string | null
          times_wrong: number | null
        }
        Relationships: [
          {
            foreignKeyName: "question_responses_quiz_session_id_fkey"
            columns: ["quiz_session_id"]
            isOneToOne: false
            referencedRelation: "quiz_kpi_summary"
            referencedColumns: ["quiz_session_id"]
          },
          {
            foreignKeyName: "question_responses_quiz_session_id_fkey"
            columns: ["quiz_session_id"]
            isOneToOne: false
            referencedRelation: "quiz_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_questions_with_answers: {
        Args: Record<PropertyKey, never>
        Returns: {
          answers: Json
          category: string
          content: Json
          created_at: string
          id: string
          normal_image_url: string
          order_index: number
          question_text: string
          result: Json
          result_image_url: string
          updated_at: string
        }[]
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

