import type { NextConfig } from "next";
import packageJson from "./package.json";
import { assertControllerConfiguredForProduction } from "./lib/privacy/policy";
import { buildSecurityHeaders } from "./lib/security/csp";
import { resolveSiteUrl } from "./lib/seo/site";

// PDPA s.23(5): no production deployment with a privacy notice that names no data controller.
assertControllerConfiguredForProduction(process.env);

type RemotePatterns = NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]>;

const isDev = process.env.NODE_ENV !== "production";
const contentfulSpaceId = process.env.CONTENTFUL_SPACE_ID?.trim();

/** Web Analytics / Speed Insights load their debug and fallback scripts from va.vercel-scripts.com. */
const dependencies: Record<string, string> = packageJson.dependencies;
const usesVercelAnalytics =
	"@vercel/analytics" in dependencies || "@vercel/speed-insights" in dependencies;

const remotePatterns: RemotePatterns = [
	{
		protocol: "https",
		hostname: "*.supabase.co",
		pathname: "/storage/**",
	},
	// Contentful assets, scoped to our space so the optimizer can't be used for other spaces' files.
	...(contentfulSpaceId && /^[a-z0-9]+$/i.test(contentfulSpaceId)
		? ([
				{
					protocol: "https",
					hostname: "images.ctfassets.net",
					pathname: `/${contentfulSpaceId}/**`,
				},
			] satisfies RemotePatterns)
		: []),
	// ngrok tunnels are for sharing a local dev server only; never allowed in production builds.
	...(isDev
		? ([
				{
					protocol: "https",
					hostname: "*.ngrok-free.app",
					pathname: "/**",
				},
			] satisfies RemotePatterns)
		: []),
];

const securityHeaders = buildSecurityHeaders({
	isDev,
	vercelAnalytics: usesVercelAnalytics,
	// Vercel preview deployments inject the Vercel Toolbar (comments / feedback on previews).
	vercelToolbar: process.env.VERCEL_ENV === "preview",
	supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
	extraImgSrc: contentfulSpaceId ? ["https://images.ctfassets.net"] : [],
});

const noIndex = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];

/** Canonical host as a full-match pattern for `missing` (has/missing values are regular expressions). */
const canonicalHostPattern = resolveSiteUrl(process.env.NEXT_PUBLIC_SITE_URL).hostname.replace(
	/[.*+?^${}()|[\]\\]/g,
	"\\$&",
);

const nextConfig: NextConfig = {
	poweredByHeader: false,
	images: {
		qualities: [75, 100],
		remotePatterns,
	},
	async headers() {
		return [
			{ source: "/:path*", headers: securityHeaders },
			// Admin, auth and API responses never belong in search results.
			{ source: "/mgmt-portal/:path*", headers: noIndex },
			{ source: "/login", headers: noIndex },
			{ source: "/api/:path*", headers: noIndex },
			// The production deployment also answers on its *.vercel.app aliases: those copies are
			// noindex per request (page metadata is decided at build time and cannot tell hosts apart).
			// Previews keep Vercel's own noindex.
			...(process.env.VERCEL_ENV === "production"
				? [
						{
							source: "/:path*",
							missing: [{ type: "host" as const, value: canonicalHostPattern }],
							headers: noIndex,
						},
					]
				: []),
		];
	},
};

export default nextConfig;
