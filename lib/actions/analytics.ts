"use server"

import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/utils/supabase/admin"

export type KpiSummaryRow = {
  scam_recognition_percentage: number | null
  risk_assessment_percentage: number | null
  protective_actions_percentage: number | null
  response_strategies_percentage: number | null
  overall_percentage?: number | null
  created_at?: string
}

export type DeviceSessionRow = {
  device_type: string | null
}

export type QuestionDifficultyRow = {
  question_id: string
  question_text: string | null
  kpi_category: string | null
  total_attempts: number | null
  success_rate: number | null
  failure_rate: number | null
  avg_response_time_ms: number | null
}

export type QuestionWrongCountRow = {
  question_id: string
  question_text: string | null
  kpi_category: string | null
  wrong_count: number | null
  total_attempts: number | null
  wrong_rate_percentage: number | null
}

export async function getAnalyticsOverview() {
  const supabase = process.env.SECRET_KEY
    ? createAdminClient()
    : await createClient()

  // KPI summary view
  const { data: kpiSummary, error: kpiError } = await supabase
    .from("quiz_kpi_summary")
    .select("*")

  if (kpiError) {
    throw new Error(`[quiz_kpi_summary] ${kpiError.message}`)
  }

  // Device sessions (prefer quiz_sessions.device_type; fallback to question_responses.device_type if column missing)
  let sessions: DeviceSessionRow[] = []
  {
    const { data, error, status } = await supabase
      .from("quiz_sessions")
      .select("device_type")
      .not("device_type", "is", null)

    // Fallback on any select error (undefined column, RLS, etc.)
    if (error) {
      const isUndefinedColumn = (error as { code?: string })?.code === "42703" || /device_type|column|does not exist/i.test(error.message || "")
      if (isUndefinedColumn || status >= 400) {
        const boundary = new Date()
        boundary.setDate(boundary.getDate() - 6)
        const { data: qrRows, error: qrError } = await supabase
          .from("question_responses")
          .select("device_type,created_at")
          .not("device_type", "is", null)
          .gte("created_at", boundary.toISOString())

        if (qrError) {
          throw new Error(`[question_responses:fallback] ${qrError.message}`)
        }

        sessions = (qrRows ?? []).map((r) => ({ device_type: (r as { device_type: string | null }).device_type }))
      } else {
        throw new Error(`[quiz_sessions] ${error.message}`)
      }
    } else {
      sessions = (data as DeviceSessionRow[]) ?? []
    }
  }

  // Question difficulty view
  const { data: questionAnalysis, error: qaError } = await supabase
    .from("question_difficulty_analysis")
    .select("*")
    .order("success_rate", { ascending: true })
    .limit(10)

  if (qaError) {
    throw new Error(`[question_difficulty_analysis] ${qaError.message}`)
  }

  // Wrong counts view (preferred for question analysis per new requirement)
  const { data: wrongCounts } = await supabase
    .from("question_wrong_counts")
    .select("*")
    .order("wrong_count", { ascending: true })
    .limit(10)

  // Do not throw if missing; we still return difficulty as fallback
  const questionWrongCounts = (wrongCounts as QuestionWrongCountRow[]) ?? []

  // Build last 7 days trend from quiz_sessions
  const boundary = new Date()
  boundary.setDate(boundary.getDate() - 6)

  const { data: trendRaw, error: trendError } = await supabase
    .from("quiz_sessions")
    .select("created_at,is_completed")
    .gte("created_at", boundary.toISOString())

  if (trendError) {
    throw new Error(`[quiz_sessions:trends] ${trendError.message}`)
  }

  const trendMap = new Map<string, { started: number; completed: number }>()
  // initialize last 7 days with zeros
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    trendMap.set(key, { started: 0, completed: 0 })
  }

  for (const row of trendRaw ?? []) {
    const key = new Date(row.created_at as string).toISOString().slice(0, 10)
    const day = trendMap.get(key)
    if (!day) continue
    day.started += 1
    if ((row.is_completed as boolean) === true) day.completed += 1
  }

  const sessionTrends = Array.from(trendMap.entries()).map(([key, v]) => ({
    date: key,
    started_sessions: v.started,
    completed_sessions: v.completed,
    completion_rate: v.started ? Math.round((v.completed / v.started) * 100) : 0,
  }))

  return {
    kpiSummary: (kpiSummary as KpiSummaryRow[]) ?? [],
    sessions: (sessions as DeviceSessionRow[]) ?? [],
    questionAnalysis: (questionAnalysis as QuestionDifficultyRow[]) ?? [],
    questionWrongCounts,
    sessionTrends,
  }
}
