import { NextResponse } from "next/server";
import { runAggregateAnalyticsJob } from "@/lib/jobs/aggregateAnalyticsJob";

const isAuthorized = (authorizationHeader: string | null) => {
	const token = authorizationHeader?.replace("Bearer ", "");
	return token && token === process.env.CRON_SECRET;
};

export async function POST(request: Request) {
	if (!isAuthorized(request.headers.get("authorization"))) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const result = await runAggregateAnalyticsJob();
	return NextResponse.json({ ok: true, result });
}
