"use client";

import { useState, useEffect, useCallback } from "react";
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
import { UserStatistic, getUserStatistics, getUserStatisticsSummary, UserStatisticsFilters } from "@/lib/actions/user-statistics";
import { Monitor, Smartphone, Tablet } from "lucide-react";

interface UserStatisticsTableProps {
  initialData?: UserStatistic[];
}

export function UserStatisticsTable({ initialData = [] }: UserStatisticsTableProps) {
  const [data, setData] = useState<UserStatistic[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [filters] = useState<UserStatisticsFilters>({
    date_from: '2025-09-01',
    date_to: '2025-09-24',
    limit: 20,
    offset: 0
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const statsData = await getUserStatistics(filters);
      setData(statsData);
    } catch (error) {
      console.error('Error loading user statistics:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };


  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile': return <Smartphone className="w-4 h-4" />;
      case 'desktop': return <Monitor className="w-4 h-4" />;
      case 'tablet': return <Tablet className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">     
      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลผู้ใช้</CardTitle>
          <CardDescription>
            รายละเอียดการใช้งานช่วง 1-24 กันยายน 2025 ({data.length} รายการ)
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
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