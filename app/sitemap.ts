import type { MetadataRoute } from "next";
import { LEARN_ARTICLES, LEARN_LAST_UPDATED } from "@/lib/content/learn-articles";
import { learnArticlePath } from "@/lib/seo/structured-data";
import { absoluteUrl } from "@/lib/seo/site";

/** Public, indexable pages only (share landings, survey and result are noindex). */
export default function sitemap(): MetadataRoute.Sitemap {
	return [
		{ url: absoluteUrl("/"), changeFrequency: "monthly", priority: 1 },
		{ url: absoluteUrl("/quiz"), changeFrequency: "monthly", priority: 0.9 },
		{
			url: absoluteUrl("/learn"),
			lastModified: LEARN_LAST_UPDATED,
			changeFrequency: "monthly",
			priority: 0.8,
		},
		...LEARN_ARTICLES.map((article) => ({
			url: absoluteUrl(learnArticlePath(article.slug)),
			lastModified: article.updatedAt,
			changeFrequency: "yearly" as const,
			priority: 0.7,
		})),
		{ url: absoluteUrl("/privacy"), changeFrequency: "yearly", priority: 0.3 },
	];
}
