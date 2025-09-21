import { NextResponse } from "next/server"
import fs from "node:fs/promises"
import path from "node:path"

type MdResponse = {
  question_id: string
  is_correct: boolean
  kpi_category?: string
  created_at?: string
}

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "quiz_response.md")
    const raw = await fs.readFile(filePath, "utf8")

    const codeBlocks = Array.from(raw.matchAll(/```json\s*([\s\S]*?)\s*```/g))
    if (!codeBlocks.length) {
      return NextResponse.json(
        {
          error: "No JSON code block found in quiz_response.md",
          hint: "Add a ```json ... ``` block with an array of responses",
          example: [
            { question_id: "q1", is_correct: true, kpi_category: "SCAM_RECOGNITION" },
            { question_id: "q2", is_correct: false, kpi_category: "PROTECTIVE_ACTIONS" },
          ],
        },
        { status: 400 }
      )
    }

    const jsonText = codeBlocks[0][1]
    const data = JSON.parse(jsonText) as MdResponse[]

    // Compute wrong counts per question
    const wrongMap = new Map<string, { question_id: string; wrong_count: number; total_attempts: number }>()
    for (const r of data) {
      const q = wrongMap.get(r.question_id) || { question_id: r.question_id, wrong_count: 0, total_attempts: 0 }
      q.total_attempts += 1
      if (r.is_correct === false) q.wrong_count += 1
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

    // Compute simple KPI averages per category
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

