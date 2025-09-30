"use server";

import { createClient } from "@/utils/supabase/server";

// Demographics Analytics
export interface DemographicsAnalytics {
  age_group: string;
  education: string;
  occupation: string;
  total_responses: number;
  avg_score_percentage: number;
  avg_score: number;
  high_performers: number;
  low_performers: number;
}

export async function getDemographicsAnalytics(): Promise<DemographicsAnalytics[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('demographics_analytics')
    .select('*')
    .order('total_responses', { ascending: false })
    .limit(20);
  
  if (error) {
    console.error('Error fetching demographics analytics:', error);
    return [];
  }
  
  return data || [];
}

// Performance Trends
export interface PerformanceTrend {
  quiz_date: string;
  week_start: string;
  month_start: string;
  total_sessions: number;
  completed_sessions: number;
  avg_score_percentage: number;
  avg_completion_time_seconds: number;
  unique_device_types: number;
  mobile_sessions: number;
  desktop_sessions: number;
}

export async function getPerformanceTrends(days: number = 30): Promise<PerformanceTrend[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('performance_trends')
    .select('*')
    .order('quiz_date', { ascending: false })
    .limit(days);
  
  if (error) {
    console.error('Error fetching performance trends:', error);
    return [];
  }
  
  return data || [];
}

// Question Performance
export interface QuestionPerformance {
  question_id: string;
  question_text: string;
  order_index: number;
  kpi_category: string;
  total_attempts: number;
  correct_attempts: number;
  success_rate: number;
  avg_response_time_ms: number;
  stddev_response_time_ms: number;
  min_response_time_ms: number;
  max_response_time_ms: number;
  unique_users_attempted: number;
}

export async function getQuestionPerformance(): Promise<QuestionPerformance[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('question_performance_detailed')
    .select('*')
    .order('order_index', { ascending: true });
  
  if (error) {
    console.error('Error fetching question performance:', error);
    return [];
  }
  
  return data || [];
}

// Device & Platform Analytics
export interface DevicePlatformAnalytics {
  device_type: string;
  total_sessions: number;
  completed_sessions: number;
  completion_rate: number;
  avg_score_percentage: number;
  avg_completion_time_seconds: number;
  first_session: string;
  last_session: string;
}

export async function getDevicePlatformAnalytics(): Promise<DevicePlatformAnalytics[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('device_platform_analytics')
    .select('*')
    .order('total_sessions', { ascending: false });
  
  if (error) {
    console.error('Error fetching device platform analytics:', error);
    return [];
  }
  
  return data || [];
}

// KPI Category Analytics
export interface KPICategoryAnalytics {
  slug: string;
  display_name: string;
  description: string;
  target_percentage: number;
  question_count: number;
  total_responses: number;
  correct_responses: number;
  actual_percentage: number;
  variance_from_target: number;
  avg_response_time_ms: number;
  unique_users: number;
}

export async function getKPICategoryAnalytics(): Promise<KPICategoryAnalytics[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('kpi_category_analytics')
    .select('*')
    .order('slug', { ascending: true });
  
  if (error) {
    console.error('Error fetching KPI category analytics:', error);
    return [];
  }
  
  return data || [];
}

// Answer Distribution Analytics
export interface AnswerDistribution {
  question_id: string;
  question_text: string;
  answer_id: string;
  answer_text: string;
  is_correct: boolean;
  times_selected: number;
  selection_percentage: number;
}

export async function getAnswerDistribution(questionId?: string): Promise<AnswerDistribution[]> {
  const supabase = await createClient();
  
  let query = supabase
    .from('answer_distribution_analytics')
    .select('*');
  
  if (questionId) {
    query = query.eq('question_id', questionId);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching answer distribution:', error);
    return [];
  }
  
  return data || [];
}

// Completion by Time Analytics
export interface CompletionByTime {
  hour_of_day: number;
  total_sessions: number;
  completed_sessions: number;
  completion_rate: number;
  avg_completion_time_seconds: number;
}

export async function getCompletionByTimeAnalytics(): Promise<CompletionByTime[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('completion_by_time_analytics')
    .select('*')
    .order('hour_of_day', { ascending: true });
  
  if (error) {
    console.error('Error fetching completion by time analytics:', error);
    return [];
  }
  
  return data || [];
}

// Summary Dashboard Stats
export interface AdvancedDashboardStats {
  total_sessions: number;
  completed_sessions: number;
  completion_rate: number;
  avg_score: number;
  total_questions: number;
  total_responses: number;
  avg_response_time_seconds: number;
  top_performing_category: string;
  lowest_performing_category: string;
}

export async function getAdvancedDashboardStats(): Promise<AdvancedDashboardStats> {
  const supabase = await createClient();
  
  // Get overall stats from quiz_sessions
  const { data: sessionStats } = await supabase
    .from('quiz_sessions')
    .select('is_completed, correct_answers, total_questions');
  
  // Get KPI analytics
  const { data: kpiData } = await supabase
    .from('kpi_category_analytics')
    .select('display_name, actual_percentage')
    .order('actual_percentage', { ascending: false });
  
  // Get response time from question_responses
  const { data: responseData } = await supabase
    .from('question_responses')
    .select('response_time_ms');
  
  const totalSessions = sessionStats?.length || 0;
  const completedSessions = sessionStats?.filter(s => s.is_completed).length || 0;
  const completionRate = totalSessions > 0 ? (completedSessions / totalSessions * 100) : 0;
  
  const totalCorrect = sessionStats?.reduce((sum, s) => sum + (s.correct_answers || 0), 0) || 0;
  const totalQuestions = sessionStats?.reduce((sum, s) => sum + (s.total_questions || 0), 0) || 0;
  const avgScore = totalQuestions > 0 ? (totalCorrect / totalQuestions * 100) : 0;
  
  const totalResponses = responseData?.length || 0;
  const avgResponseTime = responseData && responseData.length > 0
    ? responseData.reduce((sum, r) => sum + (r.response_time_ms || 0), 0) / responseData.length / 1000
    : 0;
  
  const topCategory = kpiData && kpiData.length > 0 ? kpiData[0].display_name : 'N/A';
  const lowestCategory = kpiData && kpiData.length > 0 ? kpiData[kpiData.length - 1].display_name : 'N/A';
  
  return {
    total_sessions: totalSessions,
    completed_sessions: completedSessions,
    completion_rate: Math.round(completionRate * 100) / 100,
    avg_score: Math.round(avgScore * 100) / 100,
    total_questions: totalQuestions,
    total_responses: totalResponses,
    avg_response_time_seconds: Math.round(avgResponseTime * 100) / 100,
    top_performing_category: topCategory,
    lowest_performing_category: lowestCategory,
  };
}
