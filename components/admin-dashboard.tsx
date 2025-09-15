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
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import {
	BookOpen,
	Plus,
	BarChart3,
	Users,
	FileText,
	TrendingUp,
	Clock,
	CheckCircle,
	RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

interface DashboardStats {
	totalQuestions: number;
	totalResponses: number;
	averageScore: number;
	recentQuestions: any[];
}

export function AdminDashboard() {
	const [stats, setStats] = useState<DashboardStats>({
		totalQuestions: 0,
		totalResponses: 0,
		averageScore: 0,
		recentQuestions: [],
	});
	const [isLoading, setIsLoading] = useState(true);
	const [isRefreshing, setIsRefreshing] = useState(false);

	const fetchDashboardData = async () => {
		const supabase = createClient();

		try {
			// ใช้ RPC function ที่มีอยู่แล้ว
			const { data: questionsData, error: questionsError } = await supabase.rpc(
				"get_questions_with_answers"
			);

			if (questionsError) throw questionsError;

			// Get quiz responses if table exists
			const { data: responsesData, count: responsesCount } = await supabase
				.from("quiz_responses")
				.select("*", { count: "exact", head: false });

			// Calculate average score
			let averageScore = 0;
			if (responsesData && responsesData.length > 0) {
				const totalScore = responsesData.reduce(
					(acc, curr) => acc + (curr.correct_answers || 0),
					0
				);
				const totalQuestions = responsesData.reduce(
					(acc, curr) => acc + (curr.total_questions || 0),
					0
				);
				averageScore =
					totalQuestions > 0
						? Math.round((totalScore / totalQuestions) * 100)
						: 0;
			}

			// Sort questions by created_at and get recent 5
			const sortedQuestions = questionsData
				.sort(
					(a: any, b: any) =>
						new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
				)
				.slice(0, 5);

			setStats({
				totalQuestions: questionsData?.length || 0,
				totalResponses: responsesCount || 0,
				averageScore,
				recentQuestions: sortedQuestions || [],
			});
		} catch (error) {
			console.error("Error fetching dashboard data:", error);
			toast.error("ไม่สามารถโหลดข้อมูลได้");
		} finally {
			setIsLoading(false);
			setIsRefreshing(false);
		}
	};

	useEffect(() => {
		fetchDashboardData();
	}, []);

	const handleRefresh = () => {
		setIsRefreshing(true);
		fetchDashboardData();
		toast.success("รีเฟรชข้อมูลเรียบร้อย");
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
					<p className="mt-2 text-gray-600">กำลังโหลดข้อมูล...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
					<p className="text-gray-600">
						จัดการและติดตาม Quiz ความตระหนักเรื่องการหลอกลวงออนไลน์
					</p>
				</div>
				<div className="flex gap-2">
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
					<Button asChild>
						<Link href="/mgmt-portal/quizzes/new">
							<Plus className="mr-2 h-4 w-4" />
							เพิ่มคำถามใหม่
						</Link>
					</Button>
				</div>
			</div>

			{/* Stats Cards */}
			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">คำถามทั้งหมด</CardTitle>
						<BookOpen className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stats.totalQuestions}</div>
						<p className="text-xs text-muted-foreground">คำถามที่สร้างในระบบ</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">การตอบ Quiz</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stats.totalResponses}</div>
						<p className="text-xs text-muted-foreground">
							จำนวนครั้งที่ทำ Quiz
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							อัตราการตอบถูก
						</CardTitle>
						<TrendingUp className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stats.averageScore}%</div>
						<p className="text-xs text-muted-foreground">เฉลี่ยทั้งหมด</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Status</CardTitle>
						<CheckCircle className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-green-600">Active</div>
						<p className="text-xs text-muted-foreground">ระบบทำงานปกติ</p>
					</CardContent>
				</Card>
			</div>

			{/* Quick Actions */}
			<div className="grid gap-6 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center">
							<FileText className="mr-2 h-5 w-5" />
							การจัดการเนื้อหา
						</CardTitle>
						<CardDescription>จัดการคำถาม คำตอบ และเนื้อหา Quiz</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						<Button asChild className="w-full justify-start">
							<Link href="/mgmt-portal/quizzes">
								<BookOpen className="mr-2 h-4 w-4" />
								จัดการคำถาม Quiz
							</Link>
						</Button>
						<Button asChild variant="outline" className="w-full justify-start">
							<Link href="/mgmt-portal/quizzes/new">
								<Plus className="mr-2 h-4 w-4" />
								เพิ่มคำถามใหม่
							</Link>
						</Button>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center">
							<BarChart3 className="mr-2 h-5 w-5" />
							รายงานและสถิติ
						</CardTitle>
						<CardDescription>ติดตามผลการใช้งานและประสิทธิภาพ</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						<Button variant="outline" className="w-full justify-start" disabled>
							<BarChart3 className="mr-2 h-4 w-4" />
							ดูสถิติการใช้งาน (Coming Soon)
						</Button>
						<Button variant="outline" className="w-full justify-start" disabled>
							<FileText className="mr-2 h-4 w-4" />
							รายงานผลการเรียนรู้ (Coming Soon)
						</Button>
					</CardContent>
				</Card>
			</div>

			{/* Recent Activity */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center">
						<Clock className="mr-2 h-5 w-5" />
						คำถามล่าสุด
					</CardTitle>
					<CardDescription>คำถามที่เพิ่มเข้ามาใหม่ล่าสุด</CardDescription>
				</CardHeader>
				<CardContent>
					{stats.recentQuestions.length > 0 ? (
						<div className="space-y-3">
							{stats.recentQuestions.map((question) => (
								<div
									key={question.id}
									className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
								>
									<div className="flex-1">
										<p className="font-medium text-sm">
											#{question.order_index} -{" "}
											{question.question_text?.substring(0, 80)}
											{question.question_text?.length > 80 && "..."}
										</p>
										<div className="flex items-center space-x-4 mt-1">
											<span className="text-xs text-gray-500">
												หมวดหมู่: {question.category || "ไม่ระบุ"}
											</span>
											<span className="text-xs text-gray-500">
												คำตอบ:{" "}
												{Array.isArray(question.answers)
													? question.answers.length
													: 0}{" "}
												ข้อ
											</span>
											<span className="text-xs text-gray-500">
												สร้างเมื่อ:{" "}
												{new Date(question.created_at).toLocaleDateString(
													"th-TH"
												)}
											</span>
										</div>
									</div>
									<Button asChild size="sm" variant="outline">
										<Link href={`/mgmt-portal/quizzes/${question.id}/edit`}>
											แก้ไข
										</Link>
									</Button>
								</div>
							))}
						</div>
					) : (
						<div className="text-center py-8 text-gray-500">
							<BookOpen className="mx-auto h-12 w-12 text-gray-300" />
							<p className="mt-2">ยังไม่มีคำถามในระบบ</p>
							<Button asChild className="mt-4">
								<Link href="/mgmt-portal/quizzes/new">สร้างคำถามแรก</Link>
							</Button>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
