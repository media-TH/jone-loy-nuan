import { getAnalyticsOverview } from "@/lib/actions/analytics"
import { requireAdmin } from "@/lib/security/require-admin"
import { noStoreJson } from "@/lib/security/responses"

// Per-admin, per-request data: never prerender or cache.
export const dynamic = "force-dynamic"

export async function GET() {
  const admin = await requireAdmin()
  if (!admin.ok) return admin.response

  try {
    const data = await getAnalyticsOverview()
    return noStoreJson(data, { status: 200 })
  } catch (e) {
    // Details stay in the server log; the client only learns that it failed.
    console.error("[api/analytics/overview]", e)
    return noStoreJson(
      { error: "analytics_unavailable", message: "ไม่สามารถโหลดข้อมูลสถิติได้ในขณะนี้" },
      { status: 500 },
    )
  }
}
