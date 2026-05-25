import { createAdminClient } from "@/utils/supabase/admin"

type IdempotencyResult = {
  acquired: boolean
  runWindow: string
}

const toRunWindow = (windowMinutes: number): string => {
  const now = Date.now()
  const windowMs = windowMinutes * 60 * 1000
  const floored = Math.floor(now / windowMs) * windowMs
  return new Date(floored).toISOString()
}

export const acquireJobWindow = async (jobName: string, windowMinutes: number): Promise<IdempotencyResult> => {
  const runWindow = toRunWindow(windowMinutes)
  const supabase = createAdminClient()

  const { error } = await supabase
    .from("scheduled_tasks_log")
    .insert({
        job_name: jobName,
        run_window: runWindow,
        status: "running",
        started_at: new Date().toISOString(),
      })

  if (error) {
    if (error.code === "23505") {
      return { acquired: false, runWindow }
    }
    throw error
  }

  return { acquired: true, runWindow }
}

export const completeJobWindow = async (jobName: string, runWindow: string, details: Record<string, unknown>) => {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from("scheduled_tasks_log")
    .update({
      status: "completed",
      finished_at: new Date().toISOString(),
      details,
    })
    .eq("job_name", jobName)
    .eq("run_window", runWindow)

  if (error) throw error
}

export const failJobWindow = async (jobName: string, runWindow: string, errorMessage: string, details: Record<string, unknown>) => {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from("scheduled_tasks_log")
    .update({
      status: "failed",
      finished_at: new Date().toISOString(),
      error_message: errorMessage,
      details,
    })
    .eq("job_name", jobName)
    .eq("run_window", runWindow)

  if (error) throw error
}

export const paginate = async <T>(fetchPage: (from: number, to: number) => Promise<T[]>, pageSize = 500): Promise<T[]> => {
  const rows: T[] = []
  let from = 0

  while (true) {
    const to = from + pageSize - 1
    const batch = await fetchPage(from, to)
    rows.push(...batch)

    if (batch.length < pageSize) {
      break
    }

    from += pageSize
  }

  return rows
}
