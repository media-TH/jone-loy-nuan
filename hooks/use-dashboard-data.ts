"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

export interface DashboardStats {
	totalQuestions: number;
	totalResponses: number;
	averageScore: number;
	recentQuestions: any[];
}

export function useDashboardData() {
	const [stats, setStats] = useState<DashboardStats>({
		totalQuestions: 0,
		totalResponses: 0,
		averageScore: 0,
		recentQuestions: [],
	});
	const [isLoading, setIsLoading] = useState(true);
	const [isRefreshing, setIsRefreshing] = useState(false);

	const fetchDashboardData = useCallback(async () => {
		const supabase = createClient();

		try {
			// ใช้ RPC function ที่มีอยู่แล้ว
			const { data: questionsData, error: questionsError } = await supabase.rpc(
				"get_questions_with_answers"
			);

			if (questionsError) throw questionsError;

			// Get quiz responses from quiz_sessions
			const { data: responsesData, count: responsesCount } = await supabase
				.from("quiz_sessions")
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
	}, []);

	useEffect(() => {
		fetchDashboardData();
	}, [fetchDashboardData]);

	const handleRefresh = () => {
		setIsRefreshing(true);
		fetchDashboardData();
		toast.success("รีเฟรชข้อมูลเรียบร้อย");
	};

	return {
		stats,
		isLoading,
		isRefreshing,
		handleRefresh,
		refetch: fetchDashboardData,
	};
}
