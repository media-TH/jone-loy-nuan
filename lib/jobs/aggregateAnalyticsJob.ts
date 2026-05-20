import { analyticsService } from "@/lib/services/analyticsService";

export const runAggregateAnalyticsJob = async () => {
	const metrics = await analyticsService.getOverviewMetrics();
	return {
		job: "aggregateAnalytics",
		runsAt: new Date().toISOString(),
		metricsCount: Array.isArray(metrics) ? metrics.length : metrics ? 1 : 0,
	};
};
