/**
 * Public liveness probe for uptime monitors. Deliberately cheap: no database, no secrets, no build
 * or environment details — it only proves the app is serving requests.
 */

import { noStoreJson } from "@/lib/security/responses"

export const dynamic = "force-dynamic"

export function GET() {
  return noStoreJson({ status: "ok", time: new Date().toISOString() })
}

export function HEAD() {
  return new Response(null, { status: 200, headers: { "Cache-Control": "no-store, max-age=0" } })
}
