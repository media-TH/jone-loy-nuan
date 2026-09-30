import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

export async function proxy(request: NextRequest) {
	try {
		return await updateSession(request);
	} catch (error) {
		// updateSession already fails soft; this is the last line of defence so a bug in the
		// session refresh can never take the public site down.
		console.error("[proxy] unexpected error", error);
		return NextResponse.next({ request });
	}
}

export const config = {
	matcher: [
		/*
		 * Run on pages and app API routes only. Skip:
		 * - _next/static, _next/image (build output, image optimizer)
		 * - api/health, api/cron (public liveness + secret-authenticated jobs; no session needed)
		 * - favicon, robots, sitemap, web manifest and any static asset by extension
		 * - generated Open Graph images (/opengraph-image, /learn/…/opengraph-image-<hash>, /s/…)
		 */
		"/((?!_next/static|_next/image|api/health|api/cron|favicon.ico|robots.txt|sitemap.xml|site.webmanifest|.*opengraph-image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff2?|ttf|otf|mp4|webm|txt|xml|webmanifest)$).*)",
	],
};
