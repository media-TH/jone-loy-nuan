import { LEARN_ARTICLES, type LearnArticle } from "@/lib/content/learn-articles";
import { findOgThaiIssues, OG_COPY } from "@/lib/seo/og-text";
import { SHARE_SCORES, parseShareScore, shareScorePath } from "@/lib/seo/share";
import { PUBLISHERS, SITE_TAGLINE } from "@/lib/seo/site";

function allText(article: LearnArticle): string[] {
	return [
		article.title,
		article.shortTitle,
		article.channel,
		article.description,
		article.summary,
		...article.steps.flatMap((step) => [step.title, step.detail]),
		...article.redFlags,
		...article.prevention,
		...article.ifAffected,
		...article.faq.flatMap((item) => [item.question, item.answer]),
	];
}

describe("learn articles", () => {
	it("have unique, URL-safe slugs", () => {
		const slugs = LEARN_ARTICLES.map((article) => article.slug);
		expect(new Set(slugs).size).toBe(slugs.length);
		for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
	});

	it("are complete", () => {
		for (const article of LEARN_ARTICLES) {
			expect(article.title.length).toBeLessThanOrEqual(110);
			expect(article.steps.length).toBeGreaterThanOrEqual(3);
			expect(article.redFlags.length).toBeGreaterThanOrEqual(4);
			expect(article.prevention.length).toBeGreaterThanOrEqual(3);
			expect(article.ifAffected.length).toBeGreaterThanOrEqual(3);
			expect(article.faq.length).toBeGreaterThanOrEqual(2);
			expect(article.publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
			expect(article.updatedAt >= article.publishedAt).toBe(true);
		}
	});

	it("cite no phone numbers or sites other than the official channels", () => {
		for (const article of LEARN_ARTICLES) {
			const text = allText(article).join("\n");
			for (const digits of text.match(/\d{3,}/g) ?? []) {
				expect(["1441", "1213"]).toContain(digits);
			}
			for (const domain of text.match(/[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:th|com|net|org|online)\b/gi) ?? []) {
				expect(domain).toBe("thaipoliceonline.go.th");
			}
		}
	});
});

describe("Open Graph image copy", () => {
	it("avoids Thai clusters that next/og cannot position", () => {
		const strings = [
			SITE_TAGLINE,
			...PUBLISHERS.map((org) => org.alternateName),
			OG_COPY.rootEyebrow,
			OG_COPY.rootCta,
			OG_COPY.scoreLead,
			OG_COPY.scoreCta,
			...Object.values(OG_COPY.scoreTone),
			OG_COPY.learnEyebrow,
			OG_COPY.learnFooter,
			...LEARN_ARTICLES.flatMap((article) => [
				article.shortTitle,
				article.channel,
				OG_COPY.learnFlags(article.redFlags.length),
			]),
		];

		expect(strings.flatMap(findOgThaiIssues)).toEqual([]);
	});

	it("flags the clusters it is meant to catch", () => {
		expect(findOgThaiIssues("ความเสี่ยงสูง")).toHaveLength(1);
		expect(findOgThaiIssues("ต่ำ")).toHaveLength(1);
		expect(findOgThaiIssues("ปักธง")).toHaveLength(1);
		expect(findOgThaiIssues("ญุ")).toHaveLength(1);
		expect(findOgThaiIssues("รู้ทันกลโกง")).toEqual([]);
	});
});

describe("share scores", () => {
	it("covers 0 to 10", () => {
		expect(SHARE_SCORES).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
	});

	it("accepts only canonical score params", () => {
		expect(parseShareScore("0")).toBe(0);
		expect(parseShareScore("10")).toBe(10);
		for (const value of ["07", "11", "-1", "3.5", "", "abc", "1e1"]) {
			expect(parseShareScore(value)).toBeNull();
		}
	});

	it("normalises a raw score to a path out of 10", () => {
		expect(shareScorePath(7)).toBe("/s/7");
		expect(shareScorePath(15, 20)).toBe("/s/8");
		expect(shareScorePath(25, 20)).toBe("/s/10");
		expect(shareScorePath(3, 0)).toBe("/s/0");
	});
});
