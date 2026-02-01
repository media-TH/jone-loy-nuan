"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"
import { TrendingUp, TrendingDown, Download, RefreshCw } from "lucide-react"

// ---- Types matching /api/analytics/overview response ----
interface KpiSummaryRow {
	scam_recognition_percentage: number | null
	risk_assessment_percentage: number | null
	protective_actions_percentage: number | null
	response_strategies_percentage: number | null
	overall_percentage?: number | null
	created_at?: string
}

interface QuestionWrongCountRow {
	question_id: string
	question_text: string | null
	kpi_category: string | null
	wrong_count: number | null
	total_attempts: number | null
	wrong_rate_percentage: number | null
}

interface TrendRow {
	date: string
	started_sessions: number
	completed_sessions: number
	completion_rate: number
}

interface AnalyticsOverview {
	kpiSummary: KpiSummaryRow[]
	sessions: { device_type: string | null }[]
	questionAnalysis: unknown[]
	questionWrongCounts: QuestionWrongCountRow[]
	sessionTrends: TrendRow[]
}

const getStatusBadge = (score: number, target: number) => {
  if (score >= target) {
    return <Badge className="bg-green-100 text-green-800">เป้าหมายบรรลุ</Badge>
  }
  return <Badge variant="destructive">ต่ำกว่าเป้าหมาย</Badge>
}

export default function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState("30")
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [data, setData] = useState<AnalyticsOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchOverview() {
    try {
      setLoading(true)
      const res = await fetch('/api/analytics/overview', { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = (await res.json()) as AnalyticsOverview
      setData(json)
      setLastUpdated(new Date())
      setError(null)
    } catch (e: unknown) {
      const err = e as Error
      setError(err?.message || 'โหลดข้อมูลไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!cancelled) await fetchOverview()
    }
    load()
    return () => { cancelled = true }
  }, [])

  // Derive KPI cards data from API
  const kpiCards = useMemo(() => {
    const latest: KpiSummaryRow | undefined = (data?.kpiSummary ?? []).sort((a, b) => {
      const da = a.created_at ? Date.parse(a.created_at) : 0
      const db = b.created_at ? Date.parse(b.created_at) : 0
      return da - db
    }).slice(-1)[0]

    const round = (n: number | null | undefined) => (typeof n === 'number' ? Math.round(n) : 0)

    return [
      { category: 'SCAM_RECOGNITION', label: 'การระบุการหลอกลวง', current: round(latest?.scam_recognition_percentage), target: 80 },
      { category: 'RISK_ASSESSMENT', label: 'การประเมินความเสี่ยง', current: round(latest?.risk_assessment_percentage), target: 80 },
      { category: 'PROTECTIVE_ACTIONS', label: 'การป้องกันตนเอง', current: round(latest?.protective_actions_percentage), target: 80 },
      { category: 'RESPONSE_STRATEGIES', label: 'กลยุทธ์การตอบสนอง', current: round(latest?.response_strategies_percentage), target: 80 },
    ]
  }, [data])

  const overallScore = useMemo(() => {
    const values = kpiCards.map(k => k.current).filter((v) => typeof v === 'number') as number[]
    if (!values.length) return 0
    return Math.round(values.reduce((s, v) => s + v, 0) / values.length)
  }, [kpiCards])

  const pieData = useMemo(() => ([
    { name: 'ผ่านเกณฑ์', value: kpiCards.filter(k => k.current >= k.target).length, fill: '#10b981' },
    { name: 'ต่ำกว่าเกณฑ์', value: kpiCards.filter(k => k.current < k.target).length, fill: '#ef4444' },
  ]), [kpiCards])

  const trendData = useMemo(() => {
    return (data?.sessionTrends ?? []).map(r => ({ date: r.date, completions: r.completed_sessions }))
  }, [data])

  const hardestQuestions = useMemo(() => {
    const rows = data?.questionWrongCounts ?? []
    const sorted = [...rows].sort((a, b) => (b.wrong_count ?? 0) - (a.wrong_count ?? 0)).slice(0, 10)
    return sorted.map((r) => ({
      id: r.question_id,
      text: r.question_text ?? '-',
      category: r.kpi_category ?? '-',
      success_rate: r.wrong_rate_percentage != null ? Math.max(0, 100 - Math.round(r.wrong_rate_percentage)) : 0,
      attempts: r.total_attempts ?? 0,
      avg_time: 0,
    }))
  }, [data])

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">แดชบอร์ด KPI การรับรู้การหลอกลวง</h1>
            <p className="text-muted-foreground">รายงานประสิทธิผลการศึกษาสำหรับธนาคารแห่งประเทศไทย</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 วันที่ผ่านมา</SelectItem>
                <SelectItem value="30">30 วันที่ผ่านมา</SelectItem>
                <SelectItem value="all">ทั้งหมด</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              ส่งออก
            </Button>
            <Button variant="outline" size="sm" onClick={() => fetchOverview()} disabled={loading}>
              <RefreshCw className="h-4 w-4 mr-2" />
              อัปเดต
            </Button>
          </div>
        </div>

        {/* Loading / Error */}
        {loading && (
          <Card className="border-2">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">กำลังโหลดข้อมูล...</CardTitle>
            </CardHeader>
          </Card>
        )}
        {error && (
          <Card className="border-2">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-red-600">เกิดข้อผิดพลาด: {error}</CardTitle>
            </CardHeader>
          </Card>
        )}

        {/* Overall Score */}
        {!loading && !error && (
          <Card className="border-2">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">คะแนนรวมทั้งหมด</CardTitle>
              <div className="text-6xl font-bold text-primary">{overallScore}%</div>
              <p className="text-sm text-muted-foreground">อัปเดตล่าสุด: {lastUpdated.toLocaleString('th-TH')}</p>
            </CardHeader>
          </Card>
        )}

        {/* KPI Overview Cards */}
        {!loading && !error && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {kpiCards.map((kpi) => (
            <Card
              key={kpi.category}
              className={`transition-all duration-300 ${kpi.current < kpi.target ? "animate-pulse" : ""}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{kpi.label}</CardTitle>
                  {kpi.current >= kpi.target ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.current}%</div>
                <Progress value={kpi.current} className="mt-2" />
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">เป้าหมาย: {kpi.target}%</span>
                  {getStatusBadge(kpi.current, kpi.target)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        )}

        {/* Charts Section */}
        {!loading && !error && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Bar Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>ประสิทธิภาพ KPI เทียบกับเป้าหมาย</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={kpiCards}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" fontSize={12} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="current" fill="#3b82f6" />
                  <Bar dataKey="target" fill="#e5e7eb" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>สัดส่วนการบรรลุเป้าหมาย</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {pieData.map((entry, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.fill }} />
                    <span>
                      {entry.name}: {entry.value} หมวด
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        )}

        {/* Trend Chart */}
        {!loading && !error && (
        <Card>
          <CardHeader>
            <CardTitle>แนวโน้มการทำแบบทดสอบรายวัน</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="completions" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        )}

        {/* Question Analysis Table */}
        {!loading && !error && (
        <Card>
          <CardHeader>
            <CardTitle>การวิเคราะห์คำถาม - คำถามที่ยากที่สุด</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>คำถาม</TableHead>
                  <TableHead>หมวดหมู่</TableHead>
                  <TableHead>อัตราความสำเร็จ</TableHead>
                  <TableHead>จำนวนครั้ง</TableHead>
                  <TableHead>เวลาเฉลี่ย</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hardestQuestions.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell className="max-w-xs truncate">{q.text}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{q.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{q.success_rate}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{q.attempts}</TableCell>
                    <TableCell>—</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        )}
      </div>
    </div>
  )
}
