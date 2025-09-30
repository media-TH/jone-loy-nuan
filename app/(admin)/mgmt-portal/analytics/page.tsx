import { 
  getDemographicsAnalytics, 
  getKPICategoryAnalytics,
  getQuestionPerformance,
  getDevicePlatformAnalytics,
  getCompletionByTimeAnalytics,
  getAdvancedDashboardStats
} from "@/lib/actions/advanced-analytics";
import { DemographicsChart } from "@/components/admin/demographics-chart";
import { KPIPerformanceRadar } from "@/components/admin/kpi-performance-radar";
import { QuestionDifficultyHeatmap } from "@/components/admin/question-difficulty-heatmap";
import { DeviceAnalyticsChart } from "@/components/admin/device-analytics-chart";
import { CompletionByTimeChart } from "@/components/admin/completion-by-time-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  IconChartBar, 
  IconUsers, 
  IconTarget, 
  IconClock,
  IconTrendingUp,
  IconTrendingDown 
} from "@tabler/icons-react";

export default async function AdvancedAnalyticsPage() {
  const [
    demographics,
    kpiAnalytics,
    questionPerformance,
    deviceAnalytics,
    completionByTime,
    dashboardStats
  ] = await Promise.all([
    getDemographicsAnalytics(),
    getKPICategoryAnalytics(),
    getQuestionPerformance(),
    getDevicePlatformAnalytics(),
    getCompletionByTimeAnalytics(),
    getAdvancedDashboardStats()
  ]);

  return (
      <div className="flex flex-col gap-4 md:gap-6">
        {/* Header */}
        <div>
          <div className="flex flex-col gap-4">
            <h1 className="text-3xl font-bold text-foreground">วิเคราะห์ขั้นสูง</h1>
            <p className="text-muted-foreground">
              วิเคราะห์เชิงลึกและตัวชี้วัดประสิทธิภาพของข้อมูลแบบทดสอบ
            </p>
          </div>
        </div>

        {/* Summary Stats Cards */}
        <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>จำนวนเซสชันทั้งหมด</CardDescription>
              <CardTitle className="text-3xl font-bold tabular-nums">
                {dashboardStats.total_sessions.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm">
                <IconUsers className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {dashboardStats.completed_sessions} เสร็จสิ้น
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>อัตราการทำสำเร็จ</CardDescription>
              <CardTitle className="text-3xl font-bold tabular-nums">
                {dashboardStats.completion_rate.toFixed(1)}%
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {dashboardStats.completion_rate >= 70 ? (
                  <Badge variant="outline" className="text-green-600">
                    <IconTrendingUp className="h-3 w-3 mr-1" />
                    ดี
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-orange-600">
                    <IconTrendingDown className="h-3 w-3 mr-1" />
                    ควรปรับปรุง
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>คะแนนเฉลี่ย</CardDescription>
              <CardTitle className="text-3xl font-bold tabular-nums">
                {dashboardStats.avg_score.toFixed(1)}%
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm">
                <IconTarget className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {dashboardStats.total_responses.toLocaleString()} การตอบ
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>เวลาเฉลี่ยในการตอบ</CardDescription>
              <CardTitle className="text-3xl font-bold tabular-nums">
                {dashboardStats.avg_response_time_seconds.toFixed(1)}s
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm">
                <IconClock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  ต่อคำถาม
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* KPI Performance Overview */}
        <div className="px-4 lg:px-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <KPIPerformanceRadar data={kpiAnalytics} />
            
            <Card>
              <CardHeader>
                <CardTitle>รายละเอียดหมวดหมู่ KPI</CardTitle>
                <CardDescription>
                  ตัวชี้วัดประสิทธิภาพแยกตามหมวดหมู่
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {kpiAnalytics.map((kpi) => (
                    <div 
                      key={kpi.slug}
                      className="flex items-center justify-between gap-4 rounded-lg border p-3"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{kpi.display_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {kpi.total_responses} การตอบ • {kpi.unique_users} ผู้ใช้
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold">
                            {kpi.actual_percentage.toFixed(1)}%
                          </span>
                          <Badge 
                            variant={kpi.variance_from_target >= 0 ? "default" : "secondary"}
                            className={kpi.variance_from_target >= 0 ? "bg-green-500" : "bg-orange-500"}
                          >
                            {kpi.variance_from_target >= 0 ? "+" : ""}
                            {kpi.variance_from_target.toFixed(1)}%
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          เป้าหมาย: {kpi.target_percentage}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Question Performance */}
        <div>
          <QuestionDifficultyHeatmap data={questionPerformance} />
        </div>

        {/* Device & Time Analytics */}
        <div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <DeviceAnalyticsChart data={deviceAnalytics} />
            <CompletionByTimeChart data={completionByTime} />
          </div>
        </div>

        {/* Demographics Analysis */}
        <div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <DemographicsChart data={demographics} groupBy="age_group" />
            <DemographicsChart data={demographics} groupBy="education" />
            <DemographicsChart data={demographics} groupBy="occupation" />
          </div>
        </div>

        {/* Performance Insights */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>ข้อมูลเชิงลึกสำคัญ</CardTitle>
              <CardDescription>
                สรุปข้อมูลเชิงอัตโนมัติจากข้อมูลที่มี
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="rounded-lg border p-4">
                  <div className="flex items-start gap-3">
                    <IconChartBar className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <div className="font-medium">หมวดหมู่ที่ทำได้ดีที่สุด</div>
                      <div className="text-sm text-muted-foreground">
                        {dashboardStats.top_performing_category} มีอัตราความสำเร็จสูงสุด
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="flex items-start gap-3">
                    <IconTarget className="h-5 w-5 text-orange-500 mt-0.5" />
                    <div>
                      <div className="font-medium">ต้องให้ความสำคัญ</div>
                      <div className="text-sm text-muted-foreground">
                        {dashboardStats.lowest_performing_category} จำเป็นต้องปรับปรุง
                      </div>
                    </div>
                  </div>
                </div>

                {dashboardStats.completion_rate < 70 && (
                  <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                    <div className="flex items-start gap-3">
                      <IconTrendingDown className="h-5 w-5 text-orange-600 mt-0.5" />
                      <div>
                        <div className="font-medium text-orange-900">อัตราการทำสำเร็จต่ำ</div>
                        <div className="text-sm text-orange-700">
                          ควรพิจารณาปรับความยากของแบบทดสอบหรือประสบการณ์ผู้ใช้
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
  );
}
