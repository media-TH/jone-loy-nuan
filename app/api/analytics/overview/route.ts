import { NextRequest, NextResponse } from "next/server"
import { getAnalyticsOverview } from "@/lib/actions/analytics"
import { requireAdminOrSystem } from "@/lib/auth/guards"
import { checkRateLimit } from "@/lib/api/rate-limit"

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  const rate = checkRateLimit(`analytics-overview:${ip}`)

  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  try {
    await requireAdminOrSystem()
    const data = await getAnalyticsOverview()
    return NextResponse.json(data, { status: 200 })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error"
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
