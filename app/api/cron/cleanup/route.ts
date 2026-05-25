import { type NextRequest } from "next/server"
import { runCronJob } from "@/lib/cron/run-cron-job"
import { createAdminClient } from "@/utils/supabase/admin"

export async function GET(request: NextRequest) {
  return runCronJob(request, "cleanup", 60, async () => {
    const supabase = createAdminClient()
    const pageSize = 500
    let deleted = 0
    let rounds = 0

    while (true) {
      rounds += 1
      const { data, error } = await supabase
        .from("quiz_sessions")
        .select("id")
        .lt("expires_at", new Date().toISOString())
        .eq("is_completed", false)
        .limit(pageSize)

      if (error) throw error

      const ids = (data ?? []).map((row) => row.id)
      if (!ids.length) break

      const { data: deletedRows, error: deleteError } = await supabase
        .from("quiz_sessions")
        .delete()
        .in("id", ids)
        .select("id")

      if (deleteError) throw deleteError
      deleted += deletedRows?.length ?? 0

      if (ids.length < pageSize) break
    }

    return {
      deletedSessions: deleted,
      rounds,
      pageSize,
    }
  })
}
