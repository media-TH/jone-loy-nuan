"use client"

import * as React from "react"
import { Cell, Pie, PieChart, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer } from "@/components/ui/chart"
import type { DevicePlatformAnalytics } from "@/lib/actions/advanced-analytics"

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))']

const chartConfig = {
  sessions: {
    label: "Sessions",
  },
} satisfies ChartConfig

interface DeviceAnalyticsChartProps {
  data: DevicePlatformAnalytics[]
}

export function DeviceAnalyticsChart({ data }: DeviceAnalyticsChartProps) {
  const pieData = React.useMemo(() => {
    return data.map(item => ({
      name: item.device_type,
      value: item.total_sessions,
      completionRate: item.completion_rate,
      avgScore: item.avg_score_percentage,
    }))
  }, [data])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Device Distribution</CardTitle>
        <CardDescription>
          Quiz sessions by device type
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ChartContainer>

          <div className="space-y-3">
            {data.map((item, index) => (
              <div 
                key={item.device_type}
                className="flex items-center gap-3 p-3 rounded-lg border"
              >
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <div className="flex-1">
                  <div className="font-medium capitalize">{item.device_type}</div>
                  <div className="text-sm text-muted-foreground">
                    {item.total_sessions} sessions
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {item.completion_rate.toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    completion
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
