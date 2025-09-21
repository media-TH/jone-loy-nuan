"use client";

import { useEffect, useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
	PieChart,
	Pie,
	Cell,
	LineChart,
	Line,
	Area,
	AreaChart,
} from "recharts";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	ChartLegend,
	ChartLegendContent,
	type ChartConfig,
} from "@/components/ui/chart";
import {
	RefreshCw,
	Monitor,
	Smartphone,
	Tablet,
	Globe,
	Target,
	AlertTriangle,
	CheckCircle,
	Download,
	FileText,
} from "lucide-react";
import { toast } from "sonner";

interface KPIData {
	category: string;
	current_rate: number;
	target_rate: number;
	total_responses: number;
	is_target_met: boolean;
}

interface DeviceData {
	device_type: string;
	count: number;
	percentage: number;
}

interface QuestionDifficultyData {
  question_id: string;
  question_text: string;
  kpi_category: string;
  success_rate: number;
  failure_rate: number;
  total_attempts: number;
  avg_response_time_ms: number;
}

interface QuestionWrongCountData {
  question_id: string;
  question_text: string;
  kpi_category: string;
  wrong_count: number;
  total_attempts: number;
  wrong_rate_percentage: number;
}

interface SessionTrendData {
	date: string;
	completed_sessions: number;
	started_sessions: number;
	completion_rate: number;
}

export function AnalyticsDashboard() {
	const [kpiData, setKpiData] = useState<KPIData[]>([]);
	const [deviceData, setDeviceData] = useState<DeviceData[]>([]);
  const [questionDifficultyData, setQuestionDifficultyData] = useState<QuestionDifficultyData[]>([]);
  const [questionWrongCounts, setQuestionWrongCounts] = useState<QuestionWrongCountData[]>([]);
	const [sessionTrendData, setSessionTrendData] = useState<SessionTrendData[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isRefreshing, setIsRefreshing] = useState(false);

	const fetchAnalyticsData = async () => {
		try {
			const res = await fetch("/api/analytics/overview", { cache: "no-store" });
			if (!res.ok) {
				const err = await res.json().catch(() => ({} as any));
				throw new Error(err?.error || `HTTP ${res.status}`);
			}
      const { kpiSummary, sessions, questionAnalysis, questionWrongCounts, sessionTrends } = (await res.json()) as {
        kpiSummary: any[]
        sessions: any[]
        questionAnalysis: any[]
        questionWrongCounts: any[]
        sessionTrends: any[]
      };

			// KPI mapping
			if (!kpiSummary?.length) {
				setKpiData([]);
			} else {
				const averageFor = (key: keyof (typeof kpiSummary)[number]) => {
					const total = kpiSummary.reduce(
						(acc: number, curr: any) => acc + (curr[key] ? Number(curr[key]) : 0),
						0
					);
					return Math.round(total / kpiSummary.length);
				};

				const kpiStats = [
					{ category: "Scam Recognition", current_rate: averageFor("scam_recognition_percentage"), target_rate: 80, total_responses: kpiSummary.length },
					{ category: "Risk Assessment", current_rate: averageFor("risk_assessment_percentage"), target_rate: 80, total_responses: kpiSummary.length },
					{ category: "Protective Actions", current_rate: averageFor("protective_actions_percentage"), target_rate: 80, total_responses: kpiSummary.length },
					{ category: "Response Strategies", current_rate: averageFor("response_strategies_percentage"), target_rate: 80, total_responses: kpiSummary.length },
				].map((stat) => ({ ...stat, is_target_met: stat.current_rate >= stat.target_rate }));

				setKpiData(kpiStats);
			}

			// Devices mapping
			if (!sessions?.length) {
				setDeviceData([]);
			} else {
				const counts = sessions.reduce((acc: Record<string, number>, s: any) => {
					const d = s.device_type || "unknown";
					acc[d] = (acc[d] || 0) + 1;
					return acc;
				}, {});
				const total = sessions.length;
				setDeviceData(
					Object.entries(counts).map(([device, count]) => ({
						device_type: device,
						count: count as number,
						percentage: Math.round(((count as number) / total) * 100),
					}))
				);
			}

      // Questions mapping
      setQuestionDifficultyData(questionAnalysis ?? []);
      setQuestionWrongCounts(questionWrongCounts ?? []);

      // Trends mapping (API provides ISO date; format for chart labels in render)
      setSessionTrendData(
        (sessionTrends ?? []).map((t: any) => ({
          date: new Date(t.date).toLocaleDateString("th-TH", { month: "short", day: "numeric" }),
          started_sessions: Number(t.started_sessions || 0),
          completed_sessions: Number(t.completed_sessions || 0),
          completion_rate: Number(t.completion_rate || 0),
        }))
      );

      // Demo fallback: if API returns no analytics data, synthesize a small dataset for quick visualization
      const noKpi = !kpiSummary?.length
      const noSessions = !sessions?.length
      const noQuestions = !(questionWrongCounts && questionWrongCounts.length)
      const noTrends = !(sessionTrends && sessionTrends.length)

      if (noKpi) {
        const demoKpi = [
          { category: "Scam Recognition", current_rate: 78, target_rate: 80, total_responses: 120, is_target_met: false },
          { category: "Risk Assessment", current_rate: 82, target_rate: 80, total_responses: 120, is_target_met: true },
          { category: "Protective Actions", current_rate: 75, target_rate: 80, total_responses: 120, is_target_met: false },
          { category: "Response Strategies", current_rate: 86, target_rate: 80, total_responses: 120, is_target_met: true },
        ] as KPIData[]
        setKpiData(demoKpi)
      }

      if (noSessions) {
        const demoDevices = [
          { device_type: "mobile", count: 600, percentage: 60 },
          { device_type: "desktop", count: 300, percentage: 30 },
          { device_type: "tablet", count: 100, percentage: 10 },
        ] as DeviceData[]
        setDeviceData(demoDevices)
      }

      if (noQuestions) {
        const demoQuestions = Array.from({ length: 10 }, (_, i) => ({
          question_id: `demo-q${i + 1}`,
          question_text: `เดโมคำถามหมายเลข ${i + 1}`,
          kpi_category: i % 2 ? "SCAM_RECOGNITION" : "PROTECTIVE_ACTIONS",
          wrong_count: i + 1,
          total_attempts: 50 + i * 5,
          wrong_rate_percentage: Math.round(((i + 1) / (50 + i * 5)) * 100),
        })) as QuestionWrongCountData[]
        setQuestionWrongCounts(demoQuestions)
      }

      if (noTrends) {
        const today = new Date()
        const demoTrends = Array.from({ length: 7 }, (_, idx) => {
          const d = new Date(today)
          d.setDate(d.getDate() - (6 - idx))
          const started = 80 + idx * 5
          const completed = started - (10 - Math.min(idx, 6))
          return {
            date: d.toLocaleDateString("th-TH", { month: "short", day: "numeric" }),
            started_sessions: started,
            completed_sessions: completed,
            completion_rate: Math.round((completed / started) * 100),
          }
        })
        setSessionTrendData(demoTrends)
      }

			return true;
		} catch (error) {
			const details = error instanceof Error ? error.message : JSON.stringify(error);
			console.error("Error fetching analytics data:", details);
			toast.error("ไม่สามารถโหลดข้อมูลวิเคราะห์ได้");
			return false;
		} finally {
			setIsLoading(false);
			setIsRefreshing(false);
		}
	};

	useEffect(() => {
		fetchAnalyticsData();
	}, []);

	const handleRefresh = async () => {
		setIsRefreshing(true);
		const isSuccessful = await fetchAnalyticsData();
		if (isSuccessful) {
			toast.success("รีเฟรชข้อมูลเรียบร้อย");
		}
	};

	const handleExportReport = async () => {
		let toastId: string | number | undefined;
		try {
			toastId = toast.loading("กำลังสร้างรายงาน...");

			// Simulate report generation
			await new Promise(resolve => setTimeout(resolve, 2000));

			// Create report data
			const reportData = {
				generatedAt: new Date().toLocaleDateString("th-TH"),
				kpiSummary: kpiData,
				deviceStats: deviceData,
				questionAnalysis: questionDifficultyData.slice(0, 5),
				overallScore: Math.round(kpiData.reduce((acc, curr) => acc + curr.current_rate, 0) / kpiData.length || 0),
				targetsMet: kpiData.filter(kpi => kpi.is_target_met).length,
				totalTargets: kpiData.length,
			};

			// Convert to JSON for download (in production, this would be PDF)
			const dataStr = JSON.stringify(reportData, null, 2);
			const dataBlob = new Blob([dataStr], { type: "application/json" });
			const url = URL.createObjectURL(dataBlob);

			const link = document.createElement("a");
			link.href = url;
			link.download = `scam-awareness-report-${new Date().toISOString().split("T")[0]}.json`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);

			if (toastId) {
				toast.dismiss(toastId);
			}
			toast.success("ส่งออกรายงานเรียบร้อย");
		} catch (error) {
			if (toastId) {
				toast.dismiss(toastId);
			}
			toast.error("ไม่สามารถส่งออกรายงานได้");
		}
	};

	const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

	// Chart configurations
	const kpiChartConfig = {
		current_rate: {
			label: "ผลปัจจุบัน",
			color: "hsl(var(--chart-1))",
		},
		target_rate: {
			label: "เป้าหมาย",
			color: "hsl(var(--chart-2))",
		},
	} satisfies ChartConfig;

	const deviceChartConfig = {
		mobile: {
			label: "Mobile",
			color: "hsl(var(--chart-1))",
		},
		desktop: {
			label: "Desktop",
			color: "hsl(var(--chart-2))",
		},
		tablet: {
			label: "Tablet",
			color: "hsl(var(--chart-3))",
		},
	} satisfies ChartConfig;

	const questionChartConfig = {
		success_rate: {
			label: "อัตราความสำเร็จ",
			color: "hsl(var(--chart-2))",
		},
	} satisfies ChartConfig;

	const trendChartConfig = {
		started_sessions: {
			label: "เริ่มทำ Quiz",
			color: "hsl(var(--chart-1))",
		},
		completed_sessions: {
			label: "ทำครบ",
			color: "hsl(var(--chart-2))",
		},
		completion_rate: {
			label: "อัตราการทำครบ",
			color: "hsl(var(--chart-3))",
		},
	} satisfies ChartConfig;

	const getDeviceIcon = (deviceType: string) => {
		switch (deviceType.toLowerCase()) {
			case "mobile":
				return <Smartphone className="h-4 w-4" />;
			case "tablet":
				return <Tablet className="h-4 w-4" />;
			case "desktop":
				return <Monitor className="h-4 w-4" />;
			default:
				return <Globe className="h-4 w-4" />;
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
					<p className="mt-2 text-gray-600">กำลังโหลดข้อมูลวิเคราะห์...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
					<p className="text-gray-600">
						วิเคราะห์ผลการใช้งานและประสิทธิภาพของ Quiz
					</p>
				</div>
				<Button
					onClick={handleRefresh}
					variant="outline"
					disabled={isRefreshing}
				>
					<RefreshCw
						className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
					/>
					รีเฟรช
				</Button>
			</div>

			{/* KPI Overview Cards */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				{kpiData.map((kpi, index) => (
					<Card key={index}>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">{kpi.category}</CardTitle>
							{kpi.is_target_met ? (
								<CheckCircle className="h-4 w-4 text-green-600" />
							) : (
								<AlertTriangle className="h-4 w-4 text-red-600" />
							)}
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{kpi.current_rate}%
							</div>
							<p className="text-xs text-muted-foreground">
								เป้าหมาย: {kpi.target_rate}% | ตอบ: {kpi.total_responses} ครั้ง
							</p>
							<div className="mt-2">
								<div className="flex items-center text-xs">
									<Target className="h-3 w-3 mr-1" />
									{kpi.is_target_met ? (
										<span className="text-green-600">บรรลุเป้าหมาย</span>
									) : (
										<span className="text-red-600">
											ต่ำกว่าเป้าหมาย {kpi.target_rate - kpi.current_rate}%
										</span>
									)}
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Analytics Tabs */}
			<Tabs defaultValue="summary" className="space-y-4">
				<TabsList>
					<TabsTrigger value="summary">Executive Summary</TabsTrigger>
					<TabsTrigger value="kpi">KPI Performance</TabsTrigger>
					<TabsTrigger value="devices">อุปกรณ์ที่ใช้งาน</TabsTrigger>
					<TabsTrigger value="questions">วิเคราะห์คำถาม</TabsTrigger>
					<TabsTrigger value="trends">แนวโน้มการใช้งาน</TabsTrigger>
				</TabsList>

				{/* Executive Summary Tab */}
				<TabsContent value="summary" className="space-y-4">
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						<Card>
							<CardHeader>
								<CardTitle className="text-lg">สรุปผลการดำเนินงาน</CardTitle>
								<CardDescription>
									ข้อมูลโดยรวมของระบบ Quiz
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-3">
								<div className="flex justify-between items-center">
									<span className="text-sm text-muted-foreground">Quiz ที่ทำครบ:</span>
									<span className="font-bold">{kpiData[0]?.total_responses || 0} ครั้ง</span>
								</div>
								<div className="flex justify-between items-center">
									<span className="text-sm text-muted-foreground">คะแนนเฉลี่ยรวม:</span>
									<span className="font-bold">
										{Math.round(kpiData.reduce((acc, curr) => acc + curr.current_rate, 0) / kpiData.length || 0)}%
									</span>
								</div>
								<div className="flex justify-between items-center">
									<span className="text-sm text-muted-foreground">เป้าหมายที่บรรลุ:</span>
									<span className="font-bold text-green-600">
										{kpiData.filter(kpi => kpi.is_target_met).length}/{kpiData.length} หมวด
									</span>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="text-lg">อุปกรณ์ที่ใช้มากที่สุด</CardTitle>
								<CardDescription>
									อุปกรณ์ยอดนิยมในการเข้าใช้งาน
								</CardDescription>
							</CardHeader>
							<CardContent>
								{deviceData.length > 0 && (
									<div className="space-y-3">
									{[...deviceData]
										.sort((a, b) => b.percentage - a.percentage)
										.slice(0, 3)
										.map((device, index) => (
												<div key={index} className="flex items-center justify-between">
													<div className="flex items-center space-x-2">
														{getDeviceIcon(device.device_type)}
														<span className="text-sm capitalize">{device.device_type}</span>
													</div>
													<div className="text-right">
														<span className="font-bold">{device.percentage}%</span>
														<span className="text-xs text-muted-foreground ml-1">
															({device.count} ครั้ง)
														</span>
													</div>
												</div>
											))}
									</div>
								)}
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="text-lg">คำถามที่ยากที่สุด</CardTitle>
								<CardDescription>
									คำถามที่ต้องปรับปรุง
								</CardDescription>
							</CardHeader>
							<CardContent>
								{questionDifficultyData.length > 0 && (
									<div className="space-y-3">
										{questionDifficultyData
											.slice(0, 3)
											.map((question, index) => (
												<div key={index} className="space-y-1">
													<div className="flex justify-between items-start">
														<span className="text-xs text-muted-foreground">
															{question.kpi_category}
														</span>
														<span className="text-sm font-bold text-red-600">
															{question.success_rate}%
														</span>
													</div>
										<p className="text-sm line-clamp-2">
											{question.question_text
												? `${question.question_text.substring(0, 60)}${question.question_text.length > 60 ? "..." : ""}`
												: "ไม่มีข้อมูลคำถาม"}
										</p>
												</div>
											))}
									</div>
								)}
							</CardContent>
						</Card>
					</div>

					{/* Export Section */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center">
								<FileText className="mr-2 h-5 w-5" />
								ส่งออกรายงานสำหรับ ธปท.
							</CardTitle>
							<CardDescription>
								สร้างรายงานสรุปผลการดำเนินงานเพื่อส่งให้ธนาคารแห่งประเทศไทย
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium">รายงานประจำเดือน</p>
									<p className="text-xs text-muted-foreground">
										ข้อมูล KPI, สถิติการใช้งาน และคำแนะนำ
									</p>
								</div>
								<Button onClick={handleExportReport}>
										<Download className="mr-2 h-4 w-4" />
										ส่งออกรายงาน
									</Button>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* KPI Performance Tab */}
				<TabsContent value="kpi" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>KPI Performance vs Target</CardTitle>
							<CardDescription>
								เปรียบเทียบผลงานปัจจุบันกับเป้าหมาย 80%
							</CardDescription>
						</CardHeader>
						<CardContent>
							<ChartContainer config={kpiChartConfig} className="h-[300px]">
								<BarChart data={kpiData}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis
										dataKey="category"
										tick={{ fontSize: 12 }}
										angle={-45}
										textAnchor="end"
										height={80}
									/>
									<YAxis domain={[0, 100]} />
									<ChartTooltip
										content={<ChartTooltipContent />}
									/>
									<ChartLegend content={<ChartLegendContent />} />
									<Bar dataKey="current_rate" fill="var(--color-current_rate)" name="ผลปัจจุบัน" />
									<Bar dataKey="target_rate" fill="var(--color-target_rate)" name="เป้าหมาย" />
								</BarChart>
							</ChartContainer>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Device Analytics Tab */}
				<TabsContent value="devices" className="space-y-4">
					<div className="grid gap-4 md:grid-cols-2">
						<Card>
							<CardHeader>
								<CardTitle>การใช้งานตามประเภทอุปกรณ์</CardTitle>
								<CardDescription>
									สัดส่วนการใช้งานจากอุปกรณ์ต่างๆ
								</CardDescription>
							</CardHeader>
							<CardContent>
								<ChartContainer config={deviceChartConfig} className="h-[250px]">
									<PieChart>
										<Pie
											data={deviceData}
											cx="50%"
											cy="50%"
											labelLine={false}
											label={({ device_type, percentage }) => `${device_type} ${percentage}%`}
											outerRadius={80}
											fill="#8884d8"
											dataKey="count"
										>
											{deviceData.map((entry, index) => (
												<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
											))}
										</Pie>
										<ChartTooltip content={<ChartTooltipContent />} />
									</PieChart>
								</ChartContainer>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>รายละเอียดอุปกรณ์</CardTitle>
								<CardDescription>
									จำนวนการใช้งานแยกตามอุปกรณ์
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									{deviceData.map((device, index) => (
										<div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
											<div className="flex items-center space-x-3">
												{getDeviceIcon(device.device_type)}
												<div>
													<p className="font-medium text-sm capitalize">
														{device.device_type}
													</p>
													<p className="text-xs text-gray-500">
														{device.count} ครั้ง
													</p>
												</div>
											</div>
											<div className="text-right">
												<p className="font-bold">{device.percentage}%</p>
											</div>
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

          {/* Question Analysis Tab */}
          <TabsContent value="questions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>ข้อที่คนตอบผิดมากที่สุด (เรียงจากน้อยไปมาก)</CardTitle>
                <CardDescription>
                  อิงจากจำนวนการตอบผิด (wrong_count) ต่อคำถาม
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={[...questionWrongCounts].sort((a,b) => (a.wrong_count||0)-(b.wrong_count||0))} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" dataKey="wrong_count" />
                    <YAxis type="category" dataKey="question_id" tick={{ fontSize: 10 }} width={60} />
                    <Tooltip formatter={(v: any) => [v, "ตอบผิด (ครั้ง)"]} labelFormatter={(label) => {
                      const item = questionWrongCounts.find(q => q.question_id === label)
                      return item ? (item.question_text ? item.question_text.slice(0, 60) + (item.question_text.length>60?"...":"") : label) : label
                    }} />
                    <Bar dataKey="wrong_count" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

				{/* Trends Tab */}
				<TabsContent value="trends" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>แนวโน้มการทำ Quiz (7 วันล่าสุด)</CardTitle>
							<CardDescription>
								จำนวนผู้เริ่มทำ Quiz และจำนวนที่ทำครบ
							</CardDescription>
						</CardHeader>
						<CardContent>
							<ChartContainer config={trendChartConfig} className="h-[300px]">
								<AreaChart data={sessionTrendData}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="date" />
									<YAxis />
									<ChartTooltip content={<ChartTooltipContent />} />
									<ChartLegend content={<ChartLegendContent />} />
									<Area
										type="monotone"
										dataKey="started_sessions"
										stackId="1"
										stroke="var(--color-started_sessions)"
										fill="var(--color-started_sessions)"
										fillOpacity={0.6}
										name="เริ่มทำ Quiz"
									/>
									<Area
										type="monotone"
										dataKey="completed_sessions"
										stackId="2"
										stroke="var(--color-completed_sessions)"
										fill="var(--color-completed_sessions)"
										fillOpacity={0.8}
										name="ทำครบ"
									/>
								</AreaChart>
							</ChartContainer>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>อัตราการทำ Quiz ครบ</CardTitle>
							<CardDescription>
								เปอร์เซ็นต์ของผู้ที่ทำ Quiz จนจบ
							</CardDescription>
						</CardHeader>
						<CardContent>
							<ChartContainer config={trendChartConfig} className="h-[200px]">
								<LineChart data={sessionTrendData}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="date" />
									<YAxis domain={[0, 100]} />
									<ChartTooltip content={<ChartTooltipContent />} />
									<Line
										type="monotone"
										dataKey="completion_rate"
										stroke="var(--color-completion_rate)"
										strokeWidth={3}
										dot={{ fill: "var(--color-completion_rate)", strokeWidth: 2, r: 4 }}
									/>
								</LineChart>
							</ChartContainer>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
