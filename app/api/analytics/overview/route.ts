import { NextResponse } from "next/server"
import { getAnalyticsOverview } from "@/lib/actions/analytics"

export async function GET() {
  try {
    const data = await getAnalyticsOverview()
    return NextResponse.json(data, { status: 200 })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
