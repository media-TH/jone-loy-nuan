"use client";

import { IconTrendingDown, IconTrendingUp, IconTarget } from "@tabler/icons-react";

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

const KPI_CATEGORIES = [
  {
    key: "scam_recognition",
    title: "Scam Recognition",
    description: "การรู้จำกลโกง",
    color: "bg-blue-500",
  },
  {
    key: "risk_assessment",
    title: "Risk Assessment",
    description: "การประเมินความเสี่ยง",
    color: "bg-green-500",
  },
  {
    key: "protective_actions",
    title: "Protective Actions",
    description: "การป้องกัน",
    color: "bg-yellow-500",
  },
  {
    key: "response_strategies",
    title: "Response Strategies",
    description: "กลยุทธ์การตอบสนอง",
    color: "bg-purple-500",
  },
];

export function SectionCards() {
  const { kpiData, isLoading } = useKpiData();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
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
    );
  }

  if (!kpiData) {
    return (
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Error</CardDescription>
            <CardTitle className="text-2xl font-semibold">
              ไม่สามารถโหลดข้อมูลได้
            </CardTitle>
          </CardHeader>
        </Card>
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

      {/* Overall KPI Card */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Overall Performance</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {kpiData.overall_percentage}%
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="bg-blue-500 text-white">
              <IconTarget className="mr-1 h-3 w-3" />
              รวมทั้งหมด
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            ประสิทธิภาพโดยรวม
          </div>
          <div className="text-muted-foreground">
            จากการตอบคำถามทั้งหมด
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
