"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import type { VisitorAnalytics } from "@/lib/actions/user-statistics"

export const description = "An interactive area chart"

const chartConfig = {
  visitors: {
    label: "Visitors",
    color: "var(--primary)",
  },
  completed: {
    label: "Completed Quiz",
    color: "var(--muted-foreground)",
  },
} satisfies ChartConfig

export interface ChartAreaInteractiveProps {
  analytics: VisitorAnalytics
}

export function ChartAreaInteractive({ analytics }: ChartAreaInteractiveProps) {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("30d")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  const filteredData = React.useMemo(() => {
    // Fixed date range: Sep 1, 2025 to Sep 24, 2025
    const start = new Date("2025-09-01T00:00:00Z")
    const end = new Date("2025-09-24T00:00:00Z")
    
    // Filter data within the fixed date range
    const rangeFiltered = analytics.series.filter((p) => {
      const d = new Date(p.date + "T00:00:00Z")
      return d >= start && d <= end
    })
    
    // Further filter by time range selector if needed
    if (timeRange === "7d" || timeRange === "30d") {
      const daysToShow = timeRange === "7d" ? 7 : 24 // Show all 24 days for 30d option
      return rangeFiltered.slice(-daysToShow)
    }
    
    return rangeFiltered
  }, [analytics.series, timeRange])

  const disable90 = !analytics.has90d

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>ผู้เข้าชมระบบ (Visitors) และผู้ทำแบบทดสอบ</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">ภาพรวมช่วงเวลาวันย้อนหลัง</span>
          <span className="@[540px]/card:hidden">เลือกช่วงเวลา</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={(v) => v && setTimeRange(v)}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d" disabled={disable90}>Last 3 months</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 30 days" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg" disabled={disable90}>
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillVisitors" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-visitors)" stopOpacity={1.0} />
                <stop offset="95%" stopColor="var(--color-visitors)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillCompleted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-completed)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-completed)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value + "T00:00:00Z")
                return date.toLocaleDateString("th-TH", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value + "T00:00:00Z").toLocaleDateString("th-TH", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="visitors"
              name="Visitors"
              type="natural"
              fill="url(#fillVisitors)"
              stroke="var(--color-visitors)"
              stackId="a"
            />
            <Area
              dataKey="completed"
              name="Completed"
              type="natural"
              fill="url(#fillCompleted)"
              stroke="var(--color-completed)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
