"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

export interface KpiData {
	scam_recognition_percentage: number | null;
	risk_assessment_percentage: number | null;
	protective_actions_percentage: number | null;
	response_strategies_percentage: number | null;
	overall_percentage: number | null;
}

export interface QuestionWrongData {
	question_id: string;
	question_text: string | null;
	kpi_category: string | null;
	wrong_count: number | null;
	total_attempts: number | null;
	wrong_rate_percentage: number | null;
}

export function useKpiData() {
	const [kpiData, setKpiData] = useState<KpiData | null>(null);
	const [questionWrongData, setQuestionWrongData] = useState<QuestionWrongData[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchKpiData = async () => {
			const supabase = createClient();

			try {
				// ดึงข้อมูล KPI performance จาก view
				const { data: kpiPerformance, error: kpiError } = await supabase
					.from("kpi_performance_summary")
					.select("*");

				if (kpiError) throw kpiError;

				// ดึงข้อมูล overall performance จาก view
				const { data: overallPerformance, error: overallError } = await supabase
					.from("overall_performance_summary")
					.select("*")
					.single();

				if (overallError) throw overallError;

				// แปลงข้อมูล KPI เป็น format ที่ UI ต้องการ
				const kpiPercentages: Partial<KpiData> = {};

				kpiPerformance?.forEach((kpi) => {
					const categoryKey = kpi.kpi_category.toLowerCase() + "_percentage" as keyof KpiData;
					kpiPercentages[categoryKey] = Number(kpi.success_percentage);
				});

				setKpiData({
					...kpiPercentages,
					overall_percentage: Number(overallPerformance.overall_percentage),
				} as KpiData);

				// ดึงข้อมูล question difficulty จาก view
				const { data: questionDifficulty, error: difficultyError } = await supabase
					.from("question_difficulty_analysis")
					.select("*")
					.order("wrong_rate_percentage", { ascending: false })
					.limit(10);

				if (difficultyError) throw difficultyError;

				const wrongData: QuestionWrongData[] = questionDifficulty?.map((item) => ({
					question_id: item.question_id,
					question_text: item.question_text,
					kpi_category: item.kpi_category,
					wrong_count: item.wrong_count,
					total_attempts: item.total_attempts,
					wrong_rate_percentage: Number(item.wrong_rate_percentage),
				})) || [];

				setQuestionWrongData(wrongData);

			} catch (error) {
				console.error("Error fetching KPI data:", error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchKpiData();
	}, []);

	return {
		kpiData,
		questionWrongData,
		isLoading,
	};
}
