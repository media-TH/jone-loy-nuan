import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION, SITE_LANGUAGE, SITE_NAME, SITE_SHORT_NAME } from "@/lib/seo/site";

/** Served at /manifest.webmanifest (replaces public/site.webmanifest). Colours = DS `surface`. */
export default function manifest(): MetadataRoute.Manifest {
	return {
		id: "/",
		name: SITE_NAME,
		short_name: SITE_SHORT_NAME,
		description: SITE_DESCRIPTION,
		start_url: "/",
		scope: "/",
		display: "standalone",
		orientation: "portrait-primary",
		background_color: "#f5f9ff",
		theme_color: "#f5f9ff",
		lang: SITE_LANGUAGE,
		dir: "ltr",
		categories: ["education"],
		icons: [
			{ src: "/web-app-manifest-192x192.png", sizes: "192x192", type: "image/png" },
			{ src: "/web-app-manifest-512x512.png", sizes: "512x512", type: "image/png" },
		],
	};
}
