import type { NextRequest } from "next/server"

export const validateCronAuth = (request: NextRequest): { ok: true } | { ok: false; reason: string } => {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return { ok: false, reason: "CRON_SECRET is not configured" }
  }

  const authHeader = request.headers.get("authorization")
  const cronHeader = request.headers.get("x-cron-secret")

  if (cronHeader && cronHeader === secret) {
    return { ok: true }
  }

  if (authHeader) {
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : authHeader.trim()
    if (token === secret) {
      return { ok: true }
    }
  }

  return { ok: false, reason: "Unauthorized cron request" }
}
