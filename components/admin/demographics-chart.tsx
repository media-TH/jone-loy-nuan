"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Legend, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer } from "@/components/ui/chart"
import type { DemographicsAnalytics } from "@/lib/actions/advanced-analytics"

const chartConfig = {
  total_responses: {
    label: "Total Responses",
    color: "hsl(var(--chart-1))",
  },
  avg_score_percentage: {
    label: "Avg Score %",
    color: "hsl(var(--chart-2))",
  },
  high_performers: {
    label: "High Performers",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig

interface DemographicsChartProps {
  data: DemographicsAnalytics[]
  groupBy: 'age_group' | 'education' | 'occupation'
}

export function DemographicsChart({ data, groupBy }: DemographicsChartProps) {
  const groupedData = React.useMemo(() => {
    const grouped = new Map<string, {
      total_responses: number
      avg_score_percentage: number
      high_performers: number
      low_performers: number
      count: number
    }>()

    data.forEach(item => {
      const key = item[groupBy]
      const existing = grouped.get(key) || {
        total_responses: 0,
        avg_score_percentage: 0,
        high_performers: 0,
        low_performers: 0,
        count: 0
      }

      grouped.set(key, {
        total_responses: existing.total_responses + item.total_responses,
        avg_score_percentage: ((existing.avg_score_percentage * existing.count) + item.avg_score_percentage) / (existing.count + 1),
        high_performers: existing.high_performers + item.high_performers,
        low_performers: existing.low_performers + item.low_performers,
        count: existing.count + 1
      })
    })

    return Array.from(grouped.entries()).map(([key, value]) => ({
      category: key,
      ...value
    }))
  }, [data, groupBy])

  const getTitle = () => {
    switch (groupBy) {
      case 'age_group': return 'Demographics by Age Group'
      case 'education': return 'Demographics by Education Level'
      case 'occupation': return 'Demographics by Occupation'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{getTitle()}</CardTitle>
        <CardDescription>
          Performance analysis grouped by {groupBy.replace('_', ' ')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart data={groupedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="category" 
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar 
              dataKey="total_responses" 
              fill="var(--color-total_responses)" 
              name="Total Responses"
            />
            <Bar 
              dataKey="avg_score_percentage" 
              fill="var(--color-avg_score_percentage)" 
              name="Avg Score %"
            />
            <Bar 
              dataKey="high_performers" 
              fill="var(--color-high_performers)" 
              name="High Performers"
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
