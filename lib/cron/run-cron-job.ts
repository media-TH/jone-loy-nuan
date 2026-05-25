import { NextResponse, type NextRequest } from "next/server"
import { validateCronAuth } from "@/lib/cron/auth"
import { acquireJobWindow, completeJobWindow, failJobWindow } from "@/lib/cron/idempotency"

type JobHandler = () => Promise<Record<string, unknown>>

export const runCronJob = async (
  request: NextRequest,
  jobName: string,
  windowMinutes: number,
  handler: JobHandler
) => {
  const startedAt = new Date().toISOString()
  const auth = validateCronAuth(request)

  if (!auth.ok) {
    return NextResponse.json(
      {
        ok: false,
        jobName,
        startedAt,
        error: auth.reason,
      },
      { status: 401 }
    )
  }

  const lock = await acquireJobWindow(jobName, windowMinutes)

  if (!lock.acquired) {
    return NextResponse.json(
      {
        ok: true,
        jobName,
        runWindow: lock.runWindow,
        startedAt,
        skipped: true,
        reason: "duplicate_window",
      },
      { status: 200 }
    )
  }

  try {
    const result = await handler()
    const finishedAt = new Date().toISOString()
    const details = { ...result, startedAt, finishedAt }
    await completeJobWindow(jobName, lock.runWindow, details)

    return NextResponse.json({ ok: true, jobName, runWindow: lock.runWindow, ...details }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    await failJobWindow(jobName, lock.runWindow, message, { startedAt })

    return NextResponse.json(
      {
        ok: false,
        jobName,
        runWindow: lock.runWindow,
        startedAt,
        error: message,
      },
      { status: 500 }
    )
  }
}
