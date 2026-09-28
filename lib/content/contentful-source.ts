/**
 * Quiz content from Contentful, read through the Content Delivery API (published entries only)
 * with plain fetch: no SDK dependency, and Next.js caches each request under the content tags.
 *
 * Enabled only with CONTENT_SOURCE=contentful plus CONTENTFUL_SPACE_ID and
 * CONTENTFUL_DELIVERY_TOKEN (optional: CONTENTFUL_ENVIRONMENT, default "master";
 * CONTENTFUL_LOCALE_TH / CONTENTFUL_LOCALE_EN, the Contentful locale codes for "th" / "en",
 * default: the space's default locale for "th", none for "en"). The token is server-only.
 *
 * Content model (content type id → field ids):
 * - quiz: slug (Short text, unique), title (Short text), description (Long text),
 *   questions (References, many → question; list order is the quiz order)
 * - question: prompt (Long text), order (Integer, optional: defaults to the position in
 *   quiz.questions), category (Short text), kpiCategory (Short text: one of KPI_CATEGORIES,
 *   default SCAM_RECOGNITION), scenario (JSON object: a Scenario, see lib/content/types.ts),
 *   normalImage + resultImage (Media, optional: an image-pair scenario; wins over `scenario`),
 *   imageAlt (Short text), answers (References, many → answer), correctTitle, wrongTitle,
 *   header (Short text), explanation (Long text), redFlags (References, many → redFlag)
 * - answer: text (Short text), isCorrect (Boolean)
 * - redFlag: number (Integer, optional: defaults to the position), label (Short text),
 *   detail (Long text), x, y (Decimal, 0–100: pin anchor in percent of the scenario frame)
 */

import "server-only";

import { z } from "zod";
import { DEFAULT_KPI_CATEGORY } from "@/lib/content/legacy";
import { isValidQuizSlug, parseScenario } from "@/lib/content/schema";
import {
	CONTENT_CACHE_TAG,
	CONTENT_REVALIDATE_SECONDS,
	ContentConfigError,
	ContentSourceError,
	QUIZ_LIST_CACHE_TAG,
	finalizeQuiz,
	quizCacheTag,
	type ContentSource,
	type GetQuizOptions,
} from "@/lib/content/source";
import {
	DEFAULT_LOCALE,
	type Answer,
	type ImagePairScenario,
	type Locale,
	type Question,
	type Quiz,
	type QuizSummary,
	type RedFlag,
	type Scenario,
} from "@/lib/content/types";

const SOURCE = "contentful";
const CDA_ORIGIN = "https://cdn.contentful.com";
/** quiz → question → answer / redFlag / asset. */
const INCLUDE_DEPTH = 3;
const MAX_QUIZZES = 100;

export type ContentfulConfig = {
	spaceId: string;
	deliveryToken: string;
	environment: string;
	/** Contentful locale code per app locale; unset = don't send one (space default locale). */
	locales: Partial<Record<Locale, string>>;
};

const SPACE_ID_PATTERN = /^[a-z0-9]+$/i;
const ENVIRONMENT_PATTERN = /^[a-z0-9][a-z0-9_.-]*$/i;
const TOKEN_PATTERN = /^[\w-]+$/;
const LOCALE_CODE_PATTERN = /^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i;

type Env = Record<string, string | undefined>;

/** Reads and checks the Contentful settings. Throws ContentConfigError with what is missing. */
export function contentfulConfigFromEnv(env: Env = process.env): ContentfulConfig {
	const read = (name: string) => env[name]?.trim() || undefined;

	if (read("CONTENT_SOURCE")?.toLowerCase() !== SOURCE) {
		throw new ContentConfigError(
			SOURCE,
			"Contentful is enabled only with CONTENT_SOURCE=contentful",
		);
	}

	const spaceId = read("CONTENTFUL_SPACE_ID");
	const deliveryToken = read("CONTENTFUL_DELIVERY_TOKEN");
	const missing = [
		!spaceId && "CONTENTFUL_SPACE_ID",
		!deliveryToken && "CONTENTFUL_DELIVERY_TOKEN",
	].filter(Boolean);
	if (!spaceId || !deliveryToken) {
		throw new ContentConfigError(
			SOURCE,
			`CONTENT_SOURCE=contentful needs ${missing.join(" and ")} (server-side env, never NEXT_PUBLIC_)`,
		);
	}
	if (!SPACE_ID_PATTERN.test(spaceId)) {
		throw new ContentConfigError(
			SOURCE,
			"CONTENTFUL_SPACE_ID may contain only letters and digits",
		);
	}
	if (!TOKEN_PATTERN.test(deliveryToken)) {
		throw new ContentConfigError(SOURCE, "CONTENTFUL_DELIVERY_TOKEN is malformed");
	}

	const environment = read("CONTENTFUL_ENVIRONMENT") ?? "master";
	if (!ENVIRONMENT_PATTERN.test(environment)) {
		throw new ContentConfigError(SOURCE, "CONTENTFUL_ENVIRONMENT is malformed");
	}

	const locales: Partial<Record<Locale, string>> = {};
	for (const [locale, name] of [
		["th", "CONTENTFUL_LOCALE_TH"],
		["en", "CONTENTFUL_LOCALE_EN"],
	] as const) {
		const code = read(name);
		if (!code) continue;
		if (!LOCALE_CODE_PATTERN.test(code)) {
			throw new ContentConfigError(SOURCE, `${name} is not a locale code`);
		}
		locales[locale] = code;
	}

	return { spaceId, deliveryToken, environment, locales };
}

// ---------------------------------------------------------------------------
// Content Delivery API response shapes (only what the mapping reads)
// ---------------------------------------------------------------------------

const linkSchema = z.object({
	sys: z.object({
		type: z.literal("Link"),
		linkType: z.enum(["Entry", "Asset"]),
		id: z.string(),
	}),
});

const entrySchema = z.object({
	sys: z.object({
		id: z.string().min(1),
		revision: z.number().int().optional(),
		contentType: z.object({ sys: z.object({ id: z.string() }) }).optional(),
	}),
	fields: z.record(z.unknown()).default({}),
});

const assetSchema = z.object({
	sys: z.object({ id: z.string().min(1) }),
	fields: z
		.object({
			title: z.string().optional(),
			description: z.string().optional(),
			file: z.object({ url: z.string() }).optional(),
		})
		.default({}),
});

const collectionSchema = z.object({
	items: z.array(z.unknown()),
	includes: z
		.object({
			Entry: z.array(z.unknown()).optional(),
			Asset: z.array(z.unknown()).optional(),
		})
		.optional(),
});

type CdaEntry = z.infer<typeof entrySchema>;
type CdaAsset = z.infer<typeof assetSchema>;
type CdaCollection = z.infer<typeof collectionSchema>;

function parseAll<T>(
	schema: z.ZodType<T, z.ZodTypeDef, unknown>,
	values: readonly unknown[] = [],
): T[] {
	return values.flatMap((value) => {
		const parsed = schema.safeParse(value);
		return parsed.success ? [parsed.data] : [];
	});
}

/** Linked entries and assets of one response, by id. */
class LinkResolver {
	private readonly entryById = new Map<string, CdaEntry>();
	private readonly assetById = new Map<string, CdaAsset>();

	constructor(collection: CdaCollection) {
		const entries = [...collection.items, ...(collection.includes?.Entry ?? [])];
		for (const entry of parseAll(entrySchema, entries)) {
			this.entryById.set(entry.sys.id, entry);
		}
		for (const asset of parseAll(assetSchema, collection.includes?.Asset)) {
			this.assetById.set(asset.sys.id, asset);
		}
	}

	/** Resolves a list of entry links in order, skipping unresolvable links and other content types. */
	entries(value: unknown, contentType: string): CdaEntry[] {
		return parseAll(linkSchema, Array.isArray(value) ? value : []).flatMap((link) => {
			if (link.sys.linkType !== "Entry") return [];
			const entry = this.entryById.get(link.sys.id);
			return entry?.sys.contentType?.sys.id === contentType ? [entry] : [];
		});
	}

	asset(value: unknown): CdaAsset | undefined {
		const link = linkSchema.safeParse(value);
		if (!link.success || link.data.sys.linkType !== "Asset") return undefined;
		return this.assetById.get(link.data.sys.id);
	}
}

// ---------------------------------------------------------------------------
// Mapping: Contentful entries → content model (validated afterwards by finalizeQuiz)
// ---------------------------------------------------------------------------

/** Mapped but not yet validated: every field may still be wrong. */
type Unvalidated<T> = { [K in keyof T]: unknown };

const str = (value: unknown): string | undefined => {
	if (typeof value !== "string") return undefined;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : undefined;
};

const num = (value: unknown): number | undefined =>
	typeof value === "number" && Number.isFinite(value) ? value : undefined;

/** Asset file URLs come protocol-relative ("//images.ctfassets.net/..."). */
function assetUrl(asset: CdaAsset | undefined): string | undefined {
	const url = str(asset?.fields.file?.url);
	if (!url) return undefined;
	return url.startsWith("//") ? `https:${url}` : url;
}

function mapScenario(fields: Record<string, unknown>, links: LinkResolver): Scenario | null {
	const normal = links.asset(fields.normalImage);
	const result = links.asset(fields.resultImage);
	const normalSrc = assetUrl(normal);
	const resultSrc = assetUrl(result);
	if (normalSrc && resultSrc) {
		const scenario: ImagePairScenario = {
			kind: "image-pair",
			normalSrc,
			resultSrc,
			alt:
				str(fields.imageAlt) ??
				str(normal?.fields.description) ??
				str(normal?.fields.title) ??
				str(fields.prompt) ??
				"",
		};
		return scenario;
	}
	return parseScenario(fields.scenario);
}

function mapAnswers(value: unknown, links: LinkResolver): Unvalidated<Answer>[] {
	return links.entries(value, "answer").map((entry) => ({
		id: entry.sys.id,
		text: str(entry.fields.text),
		isCorrect: entry.fields.isCorrect === true,
	}));
}

function mapRedFlags(value: unknown, links: LinkResolver): Unvalidated<RedFlag>[] {
	return links
		.entries(value, "redFlag")
		.map((entry, index) => ({
			number: num(entry.fields.number) ?? index + 1,
			label: str(entry.fields.label),
			detail: str(entry.fields.detail),
			x: num(entry.fields.x),
			y: num(entry.fields.y),
		}))
		.sort((a, b) => a.number - b.number);
}

function mapQuestion(
	entry: CdaEntry,
	index: number,
	links: LinkResolver,
): Unvalidated<Question> & { order: number } {
	const { fields } = entry;
	return {
		id: entry.sys.id,
		order: num(fields.order) ?? index + 1,
		prompt: str(fields.prompt),
		category: str(fields.category) ?? "",
		kpiCategory: str(fields.kpiCategory) ?? DEFAULT_KPI_CATEGORY,
		scenario: mapScenario(fields, links),
		answers: mapAnswers(fields.answers, links),
		result: {
			correctTitle: str(fields.correctTitle) ?? "",
			wrongTitle: str(fields.wrongTitle) ?? "",
			header: str(fields.header) ?? "",
			explanation: str(fields.explanation) ?? "",
		},
		redFlags: mapRedFlags(fields.redFlags, links),
	};
}

type QuizMeta = Omit<Quiz, "questions">;

function mapQuizMeta(entry: CdaEntry, locale: Locale): Unvalidated<QuizMeta> {
	return {
		id: entry.sys.id,
		slug: str(entry.fields.slug),
		title: str(entry.fields.title),
		description: str(entry.fields.description) ?? "",
		locale,
		// The Delivery API serves published entries only.
		status: "published",
		version: Math.max(1, entry.sys.revision ?? 1),
	};
}

/** Maps a Delivery API response for one quiz (quiz entry first in `items`) to a raw Quiz. */
export function mapContentfulQuiz(collection: unknown, locale: Locale): Unvalidated<Quiz> | null {
	const parsed = collectionSchema.safeParse(collection);
	if (!parsed.success) return null;
	const quizEntry = parseAll(entrySchema, parsed.data.items)[0];
	if (!quizEntry) return null;

	const links = new LinkResolver(parsed.data);
	const questions = links
		.entries(quizEntry.fields.questions, "question")
		.map((entry, index) => mapQuestion(entry, index, links))
		.sort((a, b) => a.order - b.order);

	return { ...mapQuizMeta(quizEntry, locale), questions };
}

// ---------------------------------------------------------------------------
// Source
// ---------------------------------------------------------------------------

export type ContentfulContentSourceOptions = {
	/** Injects fetch (tests). */
	fetch?: typeof fetch;
};

export class ContentfulContentSource implements ContentSource {
	readonly name = SOURCE;
	private readonly config: ContentfulConfig;
	private readonly fetcher: typeof fetch;

	constructor(
		config: ContentfulConfig = contentfulConfigFromEnv(),
		options: ContentfulContentSourceOptions = {},
	) {
		this.config = config;
		this.fetcher = options.fetch ?? ((input, init) => globalThis.fetch(input, init));
	}

	async getQuiz(slug: string, opts?: GetQuizOptions): Promise<Quiz | null> {
		if (!isValidQuizSlug(slug)) return null;

		// Serve the requested locale when the space has it, otherwise the default one.
		const requested = opts?.locale ?? DEFAULT_LOCALE;
		const locale: Locale =
			requested === DEFAULT_LOCALE || this.config.locales[requested] ? requested : DEFAULT_LOCALE;

		const collection = await this.getEntries(
			{
				content_type: "quiz",
				"fields.slug": slug,
				include: String(INCLUDE_DEPTH),
				limit: "1",
				...this.localeParam(locale),
			},
			[CONTENT_CACHE_TAG, quizCacheTag(slug)],
		);

		const raw = mapContentfulQuiz(collection, locale);
		return raw ? finalizeQuiz(SOURCE, slug, raw) : null;
	}

	async listQuizzes(): Promise<QuizSummary[]> {
		const collection = await this.getEntries(
			{
				content_type: "quiz",
				select: "sys.id,sys.revision,fields.slug,fields.title,fields.description,fields.questions",
				order: "fields.slug",
				include: "0",
				limit: String(MAX_QUIZZES),
				...this.localeParam(DEFAULT_LOCALE),
			},
			[CONTENT_CACHE_TAG, QUIZ_LIST_CACHE_TAG],
		);

		const parsed = collectionSchema.safeParse(collection);
		if (!parsed.success) return [];
		return parseAll(entrySchema, parsed.data.items).flatMap((entry) => {
			const meta = mapQuizMeta(entry, DEFAULT_LOCALE);
			if (!isValidQuizSlug(meta.slug) || typeof meta.title !== "string") return [];
			const questions = entry.fields.questions;
			return [
				{
					...(meta as QuizMeta),
					questionCount: Array.isArray(questions) ? questions.length : 0,
				},
			];
		});
	}

	private localeParam(locale: Locale): Record<string, string> {
		const code = this.config.locales[locale];
		return code ? { locale: code } : {};
	}

	private async getEntries(params: Record<string, string>, tags: string[]): Promise<unknown> {
		const { spaceId, environment, deliveryToken } = this.config;
		const url = new URL(
			`/spaces/${encodeURIComponent(spaceId)}/environments/${encodeURIComponent(environment)}/entries`,
			CDA_ORIGIN,
		);
		for (const [key, value] of Object.entries(params)) {
			url.searchParams.set(key, value);
		}

		let response: Response;
		try {
			response = await this.fetcher(url, {
				headers: { Authorization: `Bearer ${deliveryToken}` },
				next: { tags, revalidate: CONTENT_REVALIDATE_SECONDS },
			});
		} catch (error) {
			throw new ContentSourceError(SOURCE, "the Delivery API could not be reached", {
				cause: error,
			});
		}

		if (!response.ok) {
			const reason = await response
				.json()
				.then((body: unknown) => str((body as { message?: unknown } | null)?.message))
				.catch(() => undefined);
			const message = `the Delivery API answered ${response.status}${reason ? ` (${reason})` : ""}`;
			// 401: wrong token; 404: wrong space or environment.
			if (response.status === 401 || response.status === 404) {
				throw new ContentConfigError(
					SOURCE,
					`${message}: check CONTENTFUL_SPACE_ID, CONTENTFUL_ENVIRONMENT and CONTENTFUL_DELIVERY_TOKEN`,
				);
			}
			throw new ContentSourceError(SOURCE, message);
		}

		try {
			return await response.json();
		} catch (error) {
			throw new ContentSourceError(SOURCE, "the Delivery API sent invalid JSON", { cause: error });
		}
	}
}
