import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { SectionCards } from "@/components/section-cards";
import { UserStatisticsTable } from "@/components/user-statistics-table";
import { getVisitorAnalytics } from "@/lib/actions/user-statistics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconChartBar, IconArrowRight } from "@tabler/icons-react";
import Link from "next/link";

export default async function Page() {  
  const analytics = await getVisitorAnalytics();

  return (
      <div className="flex flex-col gap-4 md:gap-6">
        <div>
          <div className="flex flex-col gap-4">
            <h1 className="text-3xl font-bold text-foreground">แดชบอร์ด</h1>
            <p className="text-muted-foreground">ภาพรวมของระบบจัดการ Quiz</p>
          </div>
        </div>
        <SectionCards />
        
        {/* Advanced Analytics Card */}
        <div>
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <IconChartBar className="h-5 w-5 text-primary" />
                    Advanced Analytics
                  </CardTitle>
                  <CardDescription className="mt-2">
                    วิเคราะห์ข้อมูลเชิงลึก: Demographics, Device Analytics, Question Performance, และอื่นๆ
                  </CardDescription>
                </div>
                <Button asChild size="sm" className="gap-2">
                  <Link href="/mgmt-portal/analytics">
                    ดูรายละเอียด
                    <IconArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="rounded-lg border bg-background p-3">
                  <div className="text-xs text-muted-foreground">Demographics</div>
                  <div className="text-sm font-medium mt-1">Age, Education, Occupation</div>
                </div>
                <div className="rounded-lg border bg-background p-3">
                  <div className="text-xs text-muted-foreground">KPI Radar</div>
                  <div className="text-sm font-medium mt-1">Performance vs Target</div>
                </div>
                <div className="rounded-lg border bg-background p-3">
                  <div className="text-xs text-muted-foreground">Question Analysis</div>
                  <div className="text-sm font-medium mt-1">Difficulty Heatmap</div>
                </div>
                <div className="rounded-lg border bg-background p-3">
                  <div className="text-xs text-muted-foreground">Time Analysis</div>
                  <div className="text-sm font-medium mt-1">Activity by Hour</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <ChartAreaInteractive analytics={analytics} />
        </div>
        <div>
          <UserStatisticsTable />
        </div>
      </div>    
  );
}
