/**
 * schema.org builders. Every node that other nodes point at has a stable "@id" on the canonical
 * origin, so the site-wide graph (WebSite + publishers, rendered once in app/layout.tsx) can be
 * referenced from page-level data instead of being repeated.
 */

import type { LearnArticle, LearnFaq } from "@/lib/content/learn-articles";
import type { JsonLdNode } from "@/lib/seo/json-ld";
import {
	PUBLISHERS,
	SITE_DESCRIPTION,
	SITE_LANGUAGE,
	SITE_NAME,
	SITE_SHORT_NAME,
	SITE_URL,
	absoluteUrl,
} from "@/lib/seo/site";

const CONTEXT = "https://schema.org";

export const WEBSITE_ID = `${SITE_URL}/#website`;

const organizationId = (id: string) => `${SITE_URL}/#org-${id}`;

const publisherRefs = (): JsonLdNode[] => PUBLISHERS.map((org) => ({ "@id": organizationId(org.id) }));

/** The generic, root-level Open Graph image (app/opengraph-image.tsx). */
const SITE_IMAGE_URL = absoluteUrl("/opengraph-image");

/** WebSite + the organisations that publish it. Rendered once, site-wide. */
export function siteJsonLd(): JsonLdNode {
	return {
		"@context": CONTEXT,
		"@graph": [
			...PUBLISHERS.map((org) => ({
				"@type": "Organization",
				"@id": organizationId(org.id),
				name: org.name,
				alternateName: org.alternateName,
				url: org.url,
			})),
			{
				"@type": "WebSite",
				"@id": WEBSITE_ID,
				url: absoluteUrl("/"),
				name: SITE_NAME,
				alternateName: SITE_SHORT_NAME,
				description: SITE_DESCRIPTION,
				inLanguage: SITE_LANGUAGE,
				publisher: publisherRefs(),
			},
		],
	};
}

export const QUIZ_NAME = "แบบทดสอบสแกนโจร: 10 สถานการณ์จำลองกลโกงมิจฉาชีพ";
export const QUIZ_DESCRIPTION =
	"ดูสถานการณ์จำลองที่ใกล้เคียงชีวิตจริง ทั้งสายโทรเข้า SMS แชต LINE และโฆษณาออนไลน์ ตัดสินใจว่าจะทำอย่างไร แล้วดูว่าธงแดงจุดไหนที่บอกว่าเป็นมิจฉาชีพ";

/** schema.org Quiz for /quiz. */
export function quizJsonLd(): JsonLdNode {
	const url = absoluteUrl("/quiz");
	return {
		"@context": CONTEXT,
		"@type": "Quiz",
		"@id": `${url}#quiz`,
		name: QUIZ_NAME,
		description: QUIZ_DESCRIPTION,
		url,
		image: SITE_IMAGE_URL,
		inLanguage: SITE_LANGUAGE,
		educationalLevel: "general public",
		audience: { "@type": "Audience", audienceType: "ประชาชนทั่วไป" },
		about: [
			{ "@type": "Thing", name: "มิจฉาชีพออนไลน์" },
			{ "@type": "Thing", name: "การหลอกลวงทางการเงิน" },
		],
		assesses: "การสังเกตธงแดงของกลโกงมิจฉาชีพ",
		learningResourceType: "Quiz",
		isAccessibleForFree: true,
		isPartOf: { "@id": WEBSITE_ID },
		publisher: publisherRefs(),
	};
}

type Crumb = { name: string; path: string };

export function breadcrumbJsonLd(crumbs: readonly Crumb[]): JsonLdNode {
	return {
		"@context": CONTEXT,
		"@type": "BreadcrumbList",
		itemListElement: crumbs.map((crumb, index) => ({
			"@type": "ListItem",
			position: index + 1,
			name: crumb.name,
			item: absoluteUrl(crumb.path),
		})),
	};
}

export const learnArticlePath = (slug: string) => `/learn/${slug}`;

/** The /learn hub: a collection page listing every article. */
export function learnHubJsonLd(
	articles: readonly LearnArticle[],
	page: { name: string; description: string },
): JsonLdNode {
	const url = absoluteUrl("/learn");
	return {
		"@context": CONTEXT,
		"@type": "CollectionPage",
		"@id": `${url}#page`,
		url,
		name: page.name,
		description: page.description,
		inLanguage: SITE_LANGUAGE,
		isPartOf: { "@id": WEBSITE_ID },
		mainEntity: {
			"@type": "ItemList",
			itemListElement: articles.map((article, index) => ({
				"@type": "ListItem",
				position: index + 1,
				url: absoluteUrl(learnArticlePath(article.slug)),
				name: article.shortTitle,
			})),
		},
	};
}

export function articleJsonLd(article: LearnArticle): JsonLdNode {
	const url = absoluteUrl(learnArticlePath(article.slug));
	return {
		"@context": CONTEXT,
		"@type": "Article",
		"@id": `${url}#article`,
		headline: article.title,
		description: article.description,
		url,
		mainEntityOfPage: url,
		image: SITE_IMAGE_URL,
		inLanguage: SITE_LANGUAGE,
		datePublished: article.publishedAt,
		dateModified: article.updatedAt,
		articleSection: "คลังความรู้",
		about: { "@type": "Thing", name: article.shortTitle },
		author: { "@type": "Organization", name: SITE_NAME, url: absoluteUrl("/") },
		publisher: publisherRefs(),
		isPartOf: { "@id": WEBSITE_ID },
	};
}

export function faqJsonLd(faq: readonly LearnFaq[], path: string): JsonLdNode {
	return {
		"@context": CONTEXT,
		"@type": "FAQPage",
		"@id": `${absoluteUrl(path)}#faq`,
		inLanguage: SITE_LANGUAGE,
		mainEntity: faq.map((item) => ({
			"@type": "Question",
			name: item.question,
			acceptedAnswer: { "@type": "Answer", text: item.answer },
		})),
	};
}
