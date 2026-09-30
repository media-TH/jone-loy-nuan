/**
 * Supabase free-tier keep-alive.
 *
 * Supabase pauses a free project after 7 days without activity. Vercel Cron (vercel.json, daily)
 * calls this route; .github/workflows/supabase-keepalive.yml is the backup. Each call writes one row
 * through public.keepalive_ping() (supabase/migrations/07-keepalive.sql), which counts as real
 * database activity.
 *
 * Auth: `Authorization: Bearer $CRON_SECRET` (Vercel Cron sends it automatically once CRON_SECRET is
 * set on the project).
 */

import { verifyCronRequest } from "@/lib/security/cron-auth"
import { noStoreJson } from "@/lib/security/responses"
import { createAdminClient } from "@/utils/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type KeepaliveBody =
  | { ok: true; pingedAt: string }
  | { ok: false; error: "unauthorized" | "not_configured" | "db_unavailable" }

export async function GET(request: Request) {
  if (!verifyCronRequest(request)) {
    return noStoreJson<KeepaliveBody>({ ok: false, error: "unauthorized" }, { status: 401 })
  }

  let supabase: ReturnType<typeof createAdminClient>
  try {
    supabase = createAdminClient()
  } catch (error) {
    console.error("[cron/keepalive] admin client not configured", error)
    return noStoreJson<KeepaliveBody>({ ok: false, error: "not_configured" }, { status: 503 })
  }

  try {
    const { data, error } = await supabase.rpc("keepalive_ping")
    if (error) throw error

    const pingedAt = typeof data === "string" ? new Date(data).toISOString() : new Date().toISOString()
    return noStoreJson<KeepaliveBody>({ ok: true, pingedAt }, { status: 200 })
  } catch (error) {
    // Paused / restoring projects and network failures land here; the next run retries.
    console.error("[cron/keepalive] keepalive_ping failed", error)
    return noStoreJson<KeepaliveBody>({ ok: false, error: "db_unavailable" }, { status: 503 })
  }
}
