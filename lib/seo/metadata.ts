/**
 * Shared pieces of the Next.js Metadata API.
 *
 * Open Graph images come from the file conventions (app/opengraph-image.tsx and the per-route
 * opengraph-image.tsx files), never from these objects: a route segment that sets `openGraph`
 * replaces its parent's object wholesale, so only set it together with `baseOpenGraph` and never
 * with `images`.
 */

import type { Metadata } from "next";
import { IS_INDEXABLE_DEPLOYMENT, SITE_LOCALE, SITE_NAME } from "@/lib/seo/site";

type Robots = NonNullable<Metadata["robots"]>;
type OpenGraph = NonNullable<Metadata["openGraph"]>;

const INDEXABLE_ROBOTS: Robots = {
	index: true,
	follow: true,
	googleBot: {
		index: true,
		follow: true,
		"max-video-preview": -1,
		"max-image-preview": "large",
		"max-snippet": -1,
	},
};

const NOINDEX_ROBOTS: Robots = { index: false, follow: false };

/** Site default: indexable only on the real production deployment (see lib/seo/site.ts). */
export const siteRobots: Robots = IS_INDEXABLE_DEPLOYMENT ? INDEXABLE_ROBOTS : NOINDEX_ROBOTS;

/** Personal, per-session pages (survey, result): never indexed, links not followed. */
export const privatePageRobots: Robots = NOINDEX_ROBOTS;

/** Thin landing pages that exist for social previews (/s/[score]): kept out of the index. */
export const shareLandingRobots: Robots = { index: false, follow: IS_INDEXABLE_DEPLOYMENT };

/**
 * Open Graph fields every page shares. "./" resolves against each page's own pathname, so
 * og:url is always the page itself on the canonical origin. Title and description are
 * deliberately absent: Next fills them from each page's own title and description.
 */
export const baseOpenGraph = {
	siteName: SITE_NAME,
	locale: SITE_LOCALE,
	type: "website",
	url: "./",
} satisfies OpenGraph;
