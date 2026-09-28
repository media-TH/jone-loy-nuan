import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { absoluteUrl, isIndexableHost } from "@/lib/seo/site";

/** Per-session and private areas; /s/* stays crawlable so link previews can fetch its image. */
const PRIVATE_PATHS = ["/mgmt-portal", "/api", "/login", "/survey", "/result"];

/**
 * Dynamic on purpose (reads the Host header): only the real production host is crawlable.
 * Preview deployments, *.vercel.app aliases and forks get "Disallow: /" so they never compete
 * with the real site in search results.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
	const host = (await headers()).get("host");

	if (!isIndexableHost(host)) {
		return { rules: { userAgent: "*", disallow: "/" } };
	}

	return {
		rules: { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS },
		sitemap: absoluteUrl("/sitemap.xml"),
	};
}
