import { type NextRequest } from "next/server"
import { runCronJob } from "@/lib/cron/run-cron-job"
import { createAdminClient } from "@/utils/supabase/admin"
import { paginate } from "@/lib/cron/idempotency"

export async function GET(request: NextRequest) {
  return runCronJob(request, "reminders", 60, async () => {
    const supabase = createAdminClient()
    const now = new Date().toISOString()

    const expiringSessions = await paginate(async (from, to) => {
      const { data, error } = await supabase
        .from("quiz_sessions")
        .select("id, anonymous_user_id, expires_at")
        .eq("is_completed", false)
        .gt("expires_at", now)
        .lte("expires_at", new Date(Date.now() + 60 * 60 * 1000).toISOString())
        .range(from, to)

      if (error) throw error
      return data ?? []
    }, 500)

    const reminderRows = expiringSessions.map((session) => ({
      job_name: "reminder-candidate",
      run_window: `${session.id}:${new Date().toISOString().slice(0, 13)}`,
      status: "completed",
      details: {
        sessionId: session.id,
        anonymousUserId: session.anonymous_user_id,
        expiresAt: session.expires_at,
      },
      finished_at: new Date().toISOString(),
    }))

    if (reminderRows.length) {
      const { error } = await supabase
        .from("scheduled_tasks_log")
        .upsert(reminderRows, { onConflict: "job_name,run_window", ignoreDuplicates: true })
      if (error) throw error
    }

    return {
      reminderCandidates: reminderRows.length,
      pageSize: 500,
    }
  })
}
