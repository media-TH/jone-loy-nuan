import { LEARN_ARTICLES } from "@/lib/content/learn-articles";
import { serializeJsonLd, type JsonLdNode } from "@/lib/seo/json-ld";
import {
	articleJsonLd,
	breadcrumbJsonLd,
	faqJsonLd,
	quizJsonLd,
	siteJsonLd,
} from "@/lib/seo/structured-data";

describe("serializeJsonLd", () => {
	it("escapes characters that could break out of the <script> element", () => {
		const data = { name: "</script><script>alert(1)</script>", note: "<!-- & -->" };
		const json = serializeJsonLd(data);

		expect(json).not.toMatch(/[<>&]/);
		expect(JSON.parse(json)).toEqual(data);
	});

	it("serialises arrays of nodes", () => {
		const nodes: JsonLdNode[] = [{ "@type": "Thing" }, { "@type": "Thing", name: "<b>" }];
		expect(JSON.parse(serializeJsonLd(nodes))).toEqual(nodes);
	});
});

describe("schema.org builders", () => {
	it("names both publishers and links the WebSite to them", () => {
		const graph = siteJsonLd()["@graph"] as JsonLdNode[];
		const orgs = graph.filter((node) => node["@type"] === "Organization");
		const website = graph.find((node) => node["@type"] === "WebSite");

		expect(orgs.map((org) => org.alternateName)).toEqual(["Bank of Thailand", "Thai Media Fund"]);
		expect(website?.publisher).toEqual(orgs.map((org) => ({ "@id": org["@id"] })));
	});

	it("describes the quiz as a Thai Quiz for the general public", () => {
		const quiz = quizJsonLd();
		expect(quiz["@type"]).toBe("Quiz");
		expect(quiz.inLanguage).toBe("th");
		expect(quiz.educationalLevel).toBe("general public");
		expect(String(quiz.url)).toMatch(/\/quiz$/);
	});

	it("builds Article + FAQPage data for every learn article", () => {
		for (const article of LEARN_ARTICLES) {
			const data = articleJsonLd(article);
			expect(data["@type"]).toBe("Article");
			expect(String(data.url)).toMatch(new RegExp(`/learn/${article.slug}$`));
			expect(data.dateModified).toBe(article.updatedAt);

			const faq = faqJsonLd(article.faq, `/learn/${article.slug}`);
			expect(faq["@type"]).toBe("FAQPage");
			expect(faq.mainEntity).toHaveLength(article.faq.length);
		}
	});

	it("numbers breadcrumb items from 1 with absolute URLs", () => {
		const crumbs = breadcrumbJsonLd([
			{ name: "หน้าแรก", path: "/" },
			{ name: "คลังความรู้", path: "/learn" },
		]).itemListElement as JsonLdNode[];

		expect(crumbs.map((crumb) => crumb.position)).toEqual([1, 2]);
		expect(String(crumbs[1]?.item)).toMatch(/^https:\/\/.+\/learn$/);
	});
});
