"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { QuestionPerformance } from "@/lib/actions/advanced-analytics"

interface QuestionDifficultyHeatmapProps {
  data: QuestionPerformance[]
}

export function QuestionDifficultyHeatmap({ data }: QuestionDifficultyHeatmapProps) {
  const getDifficultyColor = (successRate: number) => {
    if (successRate >= 80) return 'bg-green-500'
    if (successRate >= 60) return 'bg-yellow-500'
    if (successRate >= 40) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const getDifficultyLabel = (successRate: number) => {
    if (successRate >= 80) return 'Easy'
    if (successRate >= 60) return 'Medium'
    if (successRate >= 40) return 'Hard'
    return 'Very Hard'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Question Difficulty Analysis</CardTitle>
        <CardDescription>
          Success rate heatmap for all questions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((question) => (
            <div 
              key={question.question_id}
              className="flex items-center justify-between gap-4 rounded-lg border p-3 hover:bg-accent/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Q{question.order_index + 1}
                  </span>
                  <span className="text-sm truncate">
                    {question.question_text}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {question.kpi_category}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {question.total_attempts} attempts
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-semibold">
                    {question.success_rate.toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {(question.avg_response_time_ms / 1000).toFixed(1)}s avg
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div 
                    className={`w-20 h-8 rounded ${getDifficultyColor(question.success_rate)} flex items-center justify-center`}
                  >
                    <span className="text-xs font-medium text-white">
                      {getDifficultyLabel(question.success_rate)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
