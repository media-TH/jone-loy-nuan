import { type NextRequest } from "next/server"
import { runCronJob } from "@/lib/cron/run-cron-job"
import { createAdminClient } from "@/utils/supabase/admin"
import { paginate } from "@/lib/cron/idempotency"

export async function GET(request: NextRequest) {
  return runCronJob(request, "daily-summary", 24 * 60, async () => {
    const supabase = createAdminClient()

    const sessions = await paginate(async (from, to) => {
      const { data, error } = await supabase
        .from("quiz_sessions")
        .select("id, is_completed, created_at")
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .range(from, to)

      if (error) throw error
      return data ?? []
    }, 1000)

    const completedCount = sessions.filter((session) => session.is_completed).length

    // Retry-safe write using upsert with conflict key.
    const dateKey = new Date().toISOString().slice(0, 10)
    const { error: upsertError } = await supabase.from("scheduled_tasks_log").upsert(
      {
        job_name: "daily-summary-metrics",
        run_window: dateKey,
        status: "completed",
        details: {
          totalSessions24h: sessions.length,
          completedSessions24h: completedCount,
        },
        finished_at: new Date().toISOString(),
      },
      { onConflict: "job_name,run_window" }
    )

    if (upsertError) throw upsertError

    return {
      metrics: {
        totalSessions24h: sessions.length,
        completedSessions24h: completedCount,
      },
      pageSize: 1000,
    }
  })
}
