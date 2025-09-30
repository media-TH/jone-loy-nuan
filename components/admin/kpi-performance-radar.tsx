"use client"

import * as React from "react"
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, PolarRadiusAxis, Legend, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer } from "@/components/ui/chart"
import type { KPICategoryAnalytics } from "@/lib/actions/advanced-analytics"

const chartConfig = {
  actual_percentage: {
    label: "Actual %",
    color: "hsl(var(--chart-1))",
  },
  target_percentage: {
    label: "Target %",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

interface KPIPerformanceRadarProps {
  data: KPICategoryAnalytics[]
}

export function KPIPerformanceRadar({ data }: KPIPerformanceRadarProps) {
  const radarData = React.useMemo(() => {
    return data.map(item => ({
      category: item.display_name,
      actual: item.actual_percentage,
      target: item.target_percentage,
      variance: item.variance_from_target,
    }))
  }, [data])

  return (
    <Card>
      <CardHeader>
        <CardTitle>KPI Performance Overview</CardTitle>
        <CardDescription>
          Comparison of actual performance vs target across all KPI categories
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px] w-full">
          <RadarChart data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="category" />
            <PolarRadiusAxis angle={90} domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Radar
              name="Actual Performance"
              dataKey="actual"
              stroke="var(--color-actual_percentage)"
              fill="var(--color-actual_percentage)"
              fillOpacity={0.6}
            />
            <Radar
              name="Target Performance"
              dataKey="target"
              stroke="var(--color-target_percentage)"
              fill="var(--color-target_percentage)"
              fillOpacity={0.3}
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
