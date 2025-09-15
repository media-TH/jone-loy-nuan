export type Json =
	| string
	| number
	| boolean
	| null
	| { [key: string]: Json | undefined }
	| Json[];

export type Database = {
	public: {
		Tables: {
			answers: {
				Row: {
					answer_text: string | null;
					created_at: string;
					id: string;
					is_correct: boolean;
					question_id: string | null;
				};
				Insert: {
					answer_text?: string | null;
					created_at?: string;
					id?: string;
					is_correct?: boolean;
					question_id?: string | null;
				};
				Update: {
					answer_text?: string | null;
					created_at?: string;
					id?: string;
					is_correct?: boolean;
					question_id?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "answers_question_id_fkey";
						columns: ["question_id"];
						referencedRelation: "questions";
						referencedColumns: ["id"];
					}
				];
			};
			questions: {
				Row: {
					category: string | null;
					content: Json | null;
					created_at: string;
					id: string;
					kpi_category_id: string | null;
					order_index: number | null;
					question_text: string | null;
					result: Json | null;
					updated_at: string | null;
				};
				Insert: {
					category?: string | null;
					content?: Json | null;
					created_at?: string;
					id?: string;
					kpi_category_id?: string | null;
					order_index?: number | null;
					question_text?: string | null;
					result?: Json | null;
					updated_at?: string | null;
				};
				Update: {
					category?: string | null;
					content?: Json | null;
					created_at?: string;
					id?: string;
					kpi_category_id?: string | null;
					order_index?: number | null;
					question_text?: string | null;
					result?: Json | null;
					updated_at?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "questions_kpi_category_id_fkey";
						columns: ["kpi_category_id"];
						referencedRelation: "kpi_targets";
						referencedColumns: ["id"];
					}
				];
			};
			scenario_images: {
				Row: {
					created_at: string;
					id: string;
					normal_image_url: string | null;
					question_id: string;
					result_image_url: string | null;
				};
				Insert: {
					created_at?: string;
					id?: string;
					normal_image_url?: string | null;
					question_id: string;
					result_image_url?: string | null;
				};
				Update: {
					created_at?: string;
					id?: string;
					normal_image_url?: string | null;
					question_id?: string;
					result_image_url?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "scenario_images_question_id_fkey";
						columns: ["question_id"];
						referencedRelation: "questions";
						referencedColumns: ["id"];
					}
				];
			};
			traffic_sources: {
				Row: {
					id: string;
					platform: string;
					campaign_id: string | null;
					utm_source: string | null;
					utm_medium: string | null;
					utm_campaign: string | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					platform: string;
					campaign_id?: string | null;
					utm_source?: string | null;
					utm_medium?: string | null;
					utm_campaign?: string | null;
					created_at?: string;
				};
				Update: {
					id?: string;
					platform?: string;
					campaign_id?: string | null;
					utm_source?: string | null;
					utm_medium?: string | null;
					utm_campaign?: string | null;
					created_at?: string;
				};
				Relationships: [];
			};
			quiz_sessions: {
				Row: {
					id: string;
					session_id: string;
					traffic_source_id: string | null;
					anonymous_user_id: string | null;
					total_questions: number;
					completed_questions: number;
					correct_answers: number;
					is_completed: boolean;
					completion_time_ms: number | null;
					scam_recognition_score: number | null;
					risk_assessment_score: number | null;
					protective_actions_score: number | null;
					response_strategies_score: number | null;
					created_at: string;
					expires_at: string;
				};
				Insert: {
					id?: string;
					session_id: string;
					traffic_source_id?: string | null;
					anonymous_user_id?: string | null;
					total_questions?: number;
					completed_questions?: number;
					correct_answers?: number;
					is_completed?: boolean;
					completion_time_ms?: number | null;
					scam_recognition_score?: number | null;
					risk_assessment_score?: number | null;
					protective_actions_score?: number | null;
					response_strategies_score?: number | null;
					created_at?: string;
					expires_at?: string;
				};
				Update: {
					id?: string;
					session_id?: string;
					traffic_source_id?: string | null;
					anonymous_user_id?: string | null;
					total_questions?: number;
					completed_questions?: number;
					correct_answers?: number;
					is_completed?: boolean;
					completion_time_ms?: number | null;
					scam_recognition_score?: number | null;
					risk_assessment_score?: number | null;
					protective_actions_score?: number | null;
					response_strategies_score?: number | null;
					created_at?: string;
					expires_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "quiz_sessions_traffic_source_id_fkey";
						columns: ["traffic_source_id"];
						referencedRelation: "traffic_sources";
						referencedColumns: ["id"];
					}
				];
			};
			question_responses: {
				Row: {
					id: string;
					quiz_session_id: string;
					question_id: string;
					selected_answer_id: string;
					is_correct: boolean;
					response_time_ms: number | null;
					kpi_category: string;
					question_order: number;
					created_at: string;
				};
				Insert: {
					id?: string;
					quiz_session_id: string;
					question_id: string;
					selected_answer_id: string;
					is_correct: boolean;
					response_time_ms?: number | null;
					kpi_category: string;
					question_order: number;
					created_at?: string;
				};
				Update: {
					id?: string;
					quiz_session_id?: string;
					question_id?: string;
					selected_answer_id?: string;
					is_correct?: boolean;
					response_time_ms?: number | null;
					kpi_category?: string;
					question_order?: number;
					created_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "question_responses_quiz_session_id_fkey";
						columns: ["quiz_session_id"];
						referencedRelation: "quiz_sessions";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "question_responses_question_id_fkey";
						columns: ["question_id"];
						referencedRelation: "questions";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "question_responses_selected_answer_id_fkey";
						columns: ["selected_answer_id"];
						referencedRelation: "answers";
						referencedColumns: ["id"];
					}
				];
			};
			survey_responses: {
				Row: {
					id: string;
					quiz_session_id: string;
					age_range: string | null;
					education_level: string | null;
					occupation_type: string | null;
					content_helpfulness: number | null;
					difficulty_rating: number | null;
					additional_feedback: string | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					quiz_session_id: string;
					age_range?: string | null;
					education_level?: string | null;
					occupation_type?: string | null;
					content_helpfulness?: number | null;
					difficulty_rating?: number | null;
					additional_feedback?: string | null;
					created_at?: string;
				};
				Update: {
					id?: string;
					quiz_session_id?: string;
					age_range?: string | null;
					education_level?: string | null;
					occupation_type?: string | null;
					content_helpfulness?: number | null;
					difficulty_rating?: number | null;
					additional_feedback?: string | null;
					created_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "survey_responses_quiz_session_id_fkey";
						columns: ["quiz_session_id"];
						referencedRelation: "quiz_sessions";
						referencedColumns: ["id"];
					}
				];
			};
			kpi_targets: {
				Row: {
					id: string;
					kpi_category: string;
					target_percentage: number;
					total_questions: number;
					description: string | null;
					is_active: boolean;
					created_at: string;
				};
				Insert: {
					id?: string;
					kpi_category: string;
					target_percentage?: number;
					total_questions: number;
					description?: string | null;
					is_active?: boolean;
					created_at?: string;
				};
				Update: {
					id?: string;
					kpi_category?: string;
					target_percentage?: number;
					total_questions?: number;
					description?: string | null;
					is_active?: boolean;
					created_at?: string;
				};
				Relationships: [];
			};
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			get_questions_with_answers: {
				Args: Record<PropertyKey, never>;
				Returns: {
					id: string;
					question_text: string;
					category: string;
					order_index: number;
					content: Json;
					result: Json;
					created_at: string;
					updated_at: string;
					answers: Json;
					// MANUALLY ADDED THESE FIELDS
					normal_image_url: string;
					result_image_url: string;
				}[];
			};
		};
		Enums: {
			[_ in never]: never;
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
};
