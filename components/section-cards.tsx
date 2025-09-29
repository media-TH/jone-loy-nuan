"use client";

import { IconTrendingDown, IconTrendingUp, IconTarget, IconUsers, IconTrophy } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useKpiData } from "@/hooks/use-kpi-data";
import { useDashboardData } from "@/hooks/use-dashboard-data";

const KPI_CATEGORIES = [
  {
    key: "scam_recognition",
    title: "Fraud Awareness",
    description: "รู้เท่าทันและตระหนักถึงกลโกง",
    color: "bg-blue-500",
  },
  {
    key: "risk_assessment",
    title: "Advertising Credibility",
    description: "ประเมินความน่าเชื่อถือสื่อโฆษณา",
    color: "bg-green-500",
  },
  {
    key: "protective_actions",
    title: "Crime Prevention",
    description: "มาตรการป้องกันและปราบปรามอาชญากรรม",
    color: "bg-yellow-500",
  },
  {
    key: "response_strategies",
    title: "Cyber Security",
    description: "วิธีการรักษาความปลอดภัยไซเบอร์",
    color: "bg-purple-500",
  },
];

export function SectionCards() {
  const { kpiData, isLoading: kpiLoading } = useKpiData();
  const { stats, isLoading: dashboardLoading } = useDashboardData();

  const isLoading = kpiLoading || dashboardLoading;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* Top section loading */}
        <div className="flex flex-row gap-4 px-4 lg:px-6">
          {[...Array(2)].map((_, i) => (
            <Card key={`top-${i}`} className="flex-1 animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardFooter>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Bottom KPI section loading */}
        <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
          {[...Array(5)].map((_, i) => (
            <Card key={`kpi-${i}`} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardFooter>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!kpiData || !stats) {
    return (
      <div className="space-y-4">
        <div className="flex flex-row gap-4 px-4 lg:px-6">
          <Card className="flex-1">
            <CardHeader>
              <CardDescription>Error</CardDescription>
              <CardTitle className="text-2xl font-semibold">
                ไม่สามารถโหลดข้อมูลได้
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  const getKpiValue = (key: string) => {
    const value = kpiData[key as keyof typeof kpiData];
    return typeof value === "number" ? value : 0;
  };

  const getTrendIcon = (value: number) => {
    return value >= 70 ? IconTrendingUp : IconTrendingDown;
  };

  const getTrendColor = (value: number) => {
    return value >= 70 ? "text-green-600" : "text-red-600";
  };

  return (
    <div className="space-y-4">
      {/* Top Section: Total Users and Total Score */}
      <div className="flex flex-row gap-4 px-4 lg:px-6">
        {/* Total Users Card */}
        <Card className="flex-1 @container/card">
          <CardHeader>
            <CardDescription>จำนวนผู้ใช้ทั้งหมด</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {stats.totalResponses.toLocaleString()}
            </CardTitle>
            <CardAction>
              <Badge variant="outline" className="text-blue-600">
                <IconUsers className="mr-1 h-3 w-3" />
                ผู้ใช้งาน
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Total Users
            </div>
            <div className="text-muted-foreground">
              จำนวนครั้งที่ทำ Quiz ทั้งหมด
            </div>
          </CardFooter>
        </Card>

        {/* Total Score Card */}
        <Card className="flex-1 @container/card">
          <CardHeader>
            <CardDescription>Overall Performance</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {kpiData.overall_percentage}%
            </CardTitle>
            <CardAction>
              <Badge variant="outline" className="text-orange-600">
                <IconTrophy className="mr-1 h-3 w-3" />
                คะแนน
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              คะแนนเฉลี่ยรวมทุกข้อ
            </div>
            <div className="text-muted-foreground">
              จากการตอบคำถามทั้งหมด
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Bottom Section: KPI Cards */}
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {KPI_CATEGORIES.map((category) => {
          const value = getKpiValue(category.key + "_percentage");
          const TrendIcon = getTrendIcon(value);
          const trendColor = getTrendColor(value);

          return (
            <Card key={category.key} className="@container/card">
              <CardHeader>
                <CardDescription>{category.title}</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {value}%
                </CardTitle>
                <CardAction>
                  <Badge variant="outline" className={trendColor}>
                    <TrendIcon className="mr-1 h-3 w-3" />
                    {value >= 70 ? "ดี" : "ต้องปรับปรุง"}
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  {category.description}
                </div>
                <div className="text-muted-foreground">
                  อัตราการตอบถูกเฉลี่ย
                </div>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
