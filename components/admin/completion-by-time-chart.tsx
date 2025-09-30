"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer } from "@/components/ui/chart"
import type { CompletionByTime } from "@/lib/actions/advanced-analytics"

const chartConfig = {
  completion_rate: {
    label: "Completion Rate %",
    color: "hsl(var(--chart-1))",
  },
  total_sessions: {
    label: "Total Sessions",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

interface CompletionByTimeChartProps {
  data: CompletionByTime[]
}

export function CompletionByTimeChart({ data }: CompletionByTimeChartProps) {
  const chartData = React.useMemo(() => {
    return data.map(item => ({
      hour: `${item.hour_of_day}:00`,
      hourValue: item.hour_of_day,
      completionRate: item.completion_rate,
      totalSessions: item.total_sessions,
      avgTime: item.avg_completion_time_seconds,
    }))
  }, [data])

  const peakHour = React.useMemo(() => {
    if (data.length === 0) return null
    return data.reduce((max, item) => 
      item.total_sessions > max.total_sessions ? item : max
    )
  }, [data])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity by Time of Day</CardTitle>
        <CardDescription>
          Quiz completion patterns throughout the day
          {peakHour && (
            <span className="block mt-1 text-sm">
              Peak hour: {peakHour.hour_of_day}:00 with {peakHour.total_sessions} sessions
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="fillCompletionRate" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-completion_rate)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-completion_rate)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="hour" 
              tickFormatter={(value) => value}
            />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip 
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const data = payload[0]?.payload ?? {}
                const sessions = typeof data.totalSessions === "number" ? data.totalSessions : 0
                const completion = typeof data.completionRate === "number" ? data.completionRate : 0
                const avgTime = typeof data.avgTime === "number" ? data.avgTime : 0
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="font-medium">{data.hour ?? "N/A"}</div>
                    <div className="text-sm">
                      <div>Sessions: {sessions}</div>
                      <div>Completion: {completion.toFixed(1)}%</div>
                      <div>Avg Time: {avgTime.toFixed(1)}s</div>
                    </div>
                  </div>
                )
              }}
            />
            <Legend />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="completionRate"
              stroke="var(--color-completion_rate)"
              fill="url(#fillCompletionRate)"
              name="Completion Rate %"
            />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="totalSessions"
              stroke="var(--color-total_sessions)"
              fill="var(--color-total_sessions)"
              fillOpacity={0.3}
              name="Total Sessions"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
