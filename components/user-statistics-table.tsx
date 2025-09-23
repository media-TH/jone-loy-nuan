"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserStatistic, getUserStatistics, getUserStatisticsSummary, UserStatisticsFilters } from "@/lib/actions/user-statistics";
import { RefreshCw, Filter, Download, Monitor, Smartphone, Tablet } from "lucide-react";

interface UserStatisticsTableProps {
  initialData?: UserStatistic[];
}

export function UserStatisticsTable({ initialData = [] }: UserStatisticsTableProps) {
  const [data, setData] = useState<UserStatistic[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [filters, setFilters] = useState<UserStatisticsFilters>({
    limit: 50,
    offset: 0
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, summaryData] = await Promise.all([
        getUserStatistics(filters),
        getUserStatisticsSummary()
      ]);
      setData(statsData);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error loading user statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return '-';
    const mins = Math.floor(minutes);
    const secs = Math.floor((minutes - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPerformanceBadgeVariant = (level: string) => {
    switch (level) {
      case 'excellent': return 'default';
      case 'good': return 'secondary';
      case 'fair': return 'outline';
      case 'needs_improvement': return 'destructive';
      default: return 'outline';
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile': return <Smartphone className="w-4 h-4" />;
      case 'desktop': return <Monitor className="w-4 h-4" />;
      case 'tablet': return <Tablet className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  const handleFilterChange = (key: keyof UserStatisticsFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      offset: 0 // Reset to first page when filtering
    }));
  };

  const clearFilters = () => {
    setFilters({
      limit: 50,
      offset: 0
    });
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ผู้ใช้ทั้งหมด</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total_users.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                จบ {summary.completed_users.toLocaleString()} คน ({summary.completion_rate.toFixed(1)}%)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">คะแนนเฉลี่ย</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.avg_score.toFixed(1)}/10</div>
              <p className="text-xs text-muted-foreground">
                เวลาเฉลี่ย {summary.avg_completion_time.toFixed(1)} นาที
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">อุปกรณ์ยอดนิยม</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {getDeviceIcon('mobile')} Mobile
              </div>
              <p className="text-xs text-muted-foreground">
                {summary.device_breakdown.mobile.toLocaleString()} คน
                ({((summary.device_breakdown.mobile / summary.total_users) * 100).toFixed(1)}%)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">กิจกรรมล่าสุด</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.recent_activity.last_day.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                ผู้ใช้วันนี้
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            ตัวกรอง
          </CardTitle>
          <CardDescription>
            กรองข้อมูลผู้ใช้ตามเกณฑ์ที่ต้องการ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="device-filter">อุปกรณ์</Label>
              <Select
                value={filters.device_type || ""}
                onValueChange={(value) => handleFilterChange('device_type', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="ทุกอุปกรณ์" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">ทุกอุปกรณ์</SelectItem>
                  <SelectItem value="mobile">Mobile</SelectItem>
                  <SelectItem value="desktop">Desktop</SelectItem>
                  <SelectItem value="tablet">Tablet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="performance-filter">ระดับผลงาน</Label>
              <Select
                value={filters.performance_level || ""}
                onValueChange={(value) => handleFilterChange('performance_level', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="ทุกระดับ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">ทุกระดับ</SelectItem>
                  <SelectItem value="excellent">ดีเยี่ยม</SelectItem>
                  <SelectItem value="good">ดี</SelectItem>
                  <SelectItem value="fair">พอใช้</SelectItem>
                  <SelectItem value="needs_improvement">ต้องปรับปรุง</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recency-filter">ช่วงเวลา</Label>
              <Select
                value={filters.recency || ""}
                onValueChange={(value) => handleFilterChange('recency', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="ทุกช่วงเวลา" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">ทุกช่วงเวลา</SelectItem>
                  <SelectItem value="last_hour">ชั่วโมงที่แล้ว</SelectItem>
                  <SelectItem value="last_day">วันนี้</SelectItem>
                  <SelectItem value="last_week">สัปดาห์นี้</SelectItem>
                  <SelectItem value="last_month">เดือนนี้</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="completion-filter">สถานะ</Label>
              <Select
                value={filters.is_completed === undefined ? "" : filters.is_completed.toString()}
                onValueChange={(value) => handleFilterChange('is_completed', value === "" ? undefined : value === "true")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="ทุกสถานะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">ทุกสถานะ</SelectItem>
                  <SelectItem value="true">เสร็จสิ้น</SelectItem>
                  <SelectItem value="false">ยังไม่เสร็จ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={loadData} disabled={loading} size="sm">
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              รีเฟรช
            </Button>
            <Button onClick={clearFilters} variant="outline" size="sm">
              ล้างตัวกรอง
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลผู้ใช้</CardTitle>
          <CardDescription>
            รายละเอียดการใช้งานแต่ละครั้ง ({data.length} รายการ)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ผู้ใช้</TableHead>
                  <TableHead>อุปกรณ์</TableHead>
                  <TableHead>แพลตฟอร์ม</TableHead>
                  <TableHead>เวลา</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>คะแนน</TableHead>
                  <TableHead>ความแม่นยำ</TableHead>
                  <TableHead>ระยะเวลา</TableHead>
                  <TableHead>ระดับ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      {loading ? 'กำลังโหลดข้อมูล...' : 'ไม่พบข้อมูล'}
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-mono text-xs">
                        {row.anonymous_user_id}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getDeviceIcon(row.device_type)}
                          <span className="capitalize">{row.device_type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{row.platform}</div>
                          <div className="text-xs text-muted-foreground">{row.browser}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(row.created_at)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={row.is_completed ? "default" : "secondary"}>
                          {row.is_completed ? "เสร็จสิ้น" : "ไม่เสร็จ"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono">
                        {row.total_summary_score ? `${row.total_summary_score}/10` : '-'}
                      </TableCell>
                      <TableCell className="font-mono">
                        {row.accuracy_percentage ? `${row.accuracy_percentage}%` : '-'}
                      </TableCell>
                      <TableCell className="font-mono">
                        {formatDuration(row.completion_time_minutes)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getPerformanceBadgeVariant(row.performance_level)}>
                          {row.performance_level === 'excellent' && 'ดีเยี่ยม'}
                          {row.performance_level === 'good' && 'ดี'}
                          {row.performance_level === 'fair' && 'พอใช้'}
                          {row.performance_level === 'needs_improvement' && 'ต้องปรับปรุง'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}