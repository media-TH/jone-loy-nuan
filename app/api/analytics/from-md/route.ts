import { NextRequest, NextResponse } from "next/server"
import fs from "node:fs/promises"
import path from "node:path"
import { z } from "zod"
import { checkRateLimit } from "@/lib/api/rate-limit"

const mdResponseSchema = z.object({
  question_id: z.string().min(1),
  is_correct: z.boolean(),
  kpi_category: z.string().optional(),
  created_at: z.string().optional(),
})

const mdPayloadSchema = z.array(mdResponseSchema).min(1)

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  const rate = checkRateLimit(`analytics-from-md:${ip}`)

  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  try {
    const filePath = path.join(process.cwd(), "quiz_response.md")
    const raw = await fs.readFile(filePath, "utf8")

    const codeBlocks = Array.from(raw.matchAll(/```json\s*([\s\S]*?)\s*```/g))
    if (!codeBlocks.length) {
      return NextResponse.json({ error: "No JSON code block found in quiz_response.md" }, { status: 400 })
    }

    const jsonText = codeBlocks[0][1]
    const parsed = JSON.parse(jsonText)
    const data = mdPayloadSchema.parse(parsed)

    const wrongMap = new Map<string, { question_id: string; wrong_count: number; total_attempts: number }>()
    for (const r of data) {
      const q = wrongMap.get(r.question_id) || { question_id: r.question_id, wrong_count: 0, total_attempts: 0 }
      q.total_attempts += 1
      if (!r.is_correct) q.wrong_count += 1
      wrongMap.set(r.question_id, q)
    }

    const questionWrongCounts = Array.from(wrongMap.values())
      .map((x) => ({
        question_id: x.question_id,
        question_text: x.question_id,
        kpi_category: undefined,
        wrong_count: x.wrong_count,
        total_attempts: x.total_attempts,
        wrong_rate_percentage: x.total_attempts ? Math.round((x.wrong_count / x.total_attempts) * 100) : 0,
      }))
      .sort((a, b) => (a.wrong_count || 0) - (b.wrong_count || 0))
      .slice(0, 10)

    const byCat = new Map<string, { correct: number; total: number }>()
    for (const r of data) {
      const key = r.kpi_category || "UNKNOWN"
      const v = byCat.get(key) || { correct: 0, total: 0 }
      v.total += 1
      if (r.is_correct) v.correct += 1
      byCat.set(key, v)
    }

    const kpiSummary = Array.from(byCat.entries()).map(([category, v]) => ({
      category,
      current_rate: v.total ? Math.round((v.correct / v.total) * 100) : 0,
      target_rate: 80,
      total_responses: v.total,
      is_target_met: v.total ? Math.round((v.correct / v.total) * 100) >= 80 : false,
    }))

    return NextResponse.json({ questionWrongCounts, kpiSummary }, { status: 200 })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
