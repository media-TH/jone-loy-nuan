"use server";

import { createClient } from "@/utils/supabase/server";

export interface UserStatistic {
  id: string;
  anonymous_user_id: string;
  device_type: 'mobile' | 'desktop' | 'tablet';
  platform: string;
  browser: string;
  created_at: string;
  is_completed: boolean;
  total_summary_score: number | null;
  completion_time_minutes: number | null;
  accuracy_percentage: number | null;
  performance_level: 'excellent' | 'good' | 'fair' | 'needs_improvement';
  recency: 'last_hour' | 'last_day' | 'last_week' | 'last_month' | 'older';
}

export interface UserStatisticsFilters {
  device_type?: 'mobile' | 'desktop' | 'tablet';
  performance_level?: 'excellent' | 'good' | 'fair' | 'needs_improvement';
  recency?: 'last_hour' | 'last_day' | 'last_week' | 'last_month' | 'older';
  is_completed?: boolean;
  limit?: number;
  offset?: number;
}

export async function getUserStatistics(filters: UserStatisticsFilters = {}) {
  const supabase = await createClient();

  let query = supabase
    .from('user_statistics')
    .select(`
      id,
      anonymous_user_id,
      device_type,
      platform,
      browser,
      created_at,
      is_completed,
      total_summary_score,
      completion_time_minutes,
      accuracy_percentage,
      performance_level,
      recency
    `)
    .order('created_at', { ascending: false });

  // Apply filters
  if (filters.device_type) {
    query = query.eq('device_type', filters.device_type);
  }

  if (filters.performance_level) {
    query = query.eq('performance_level', filters.performance_level);
  }

  if (filters.recency) {
    query = query.eq('recency', filters.recency);
  }

  if (filters.is_completed !== undefined) {
    query = query.eq('is_completed', filters.is_completed);
  }

  // Apply pagination
  const limit = filters.limit || 50;
  const offset = filters.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching user statistics:', error);
    throw new Error('Failed to fetch user statistics');
  }

  return data as UserStatistic[];
}

export async function getUserStatisticsSummary() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('user_statistics')
    .select(`
      device_type,
      total_summary_score,
      completion_time_minutes,
      is_completed,
      performance_level,
      recency
    `)
    .not('anonymous_user_id', 'is', null);

  if (error) {
    console.error('Error fetching user statistics summary:', error);
    throw new Error('Failed to fetch user statistics summary');
  }

  // Calculate summary metrics
  const summary = {
    total_users: data.length,
    completed_users: data.filter(item => item.is_completed).length,
    completion_rate: 0,
    avg_score: 0,
    avg_completion_time: 0,
    device_breakdown: {
      mobile: 0,
      desktop: 0,
      tablet: 0
    },
    performance_breakdown: {
      excellent: 0,
      good: 0,
      fair: 0,
      needs_improvement: 0
    },
    recent_activity: {
      last_hour: 0,
      last_day: 0,
      last_week: 0,
      last_month: 0
    }
  };

  if (data.length > 0) {
    summary.completion_rate = (summary.completed_users / summary.total_users) * 100;

    const completedData = data.filter(item => item.is_completed && item.total_summary_score !== null);
    if (completedData.length > 0) {
      summary.avg_score = completedData.reduce((sum, item) => sum + (item.total_summary_score || 0), 0) / completedData.length;

      const timedData = completedData.filter(item => item.completion_time_minutes !== null);
      if (timedData.length > 0) {
        summary.avg_completion_time = timedData.reduce((sum, item) => sum + (item.completion_time_minutes || 0), 0) / timedData.length;
      }
    }

    // Device breakdown
    data.forEach(item => {
      if (item.device_type in summary.device_breakdown) {
        summary.device_breakdown[item.device_type as keyof typeof summary.device_breakdown]++;
      }
    });

    // Performance breakdown
    data.forEach(item => {
      if (item.performance_level in summary.performance_breakdown) {
        summary.performance_breakdown[item.performance_level as keyof typeof summary.performance_breakdown]++;
      }
    });

    // Recent activity
    data.forEach(item => {
      if (item.recency && ['last_hour', 'last_day', 'last_week', 'last_month'].includes(item.recency)) {
        summary.recent_activity[item.recency as keyof typeof summary.recent_activity]++;
      }
    });
  }

  return summary;
}