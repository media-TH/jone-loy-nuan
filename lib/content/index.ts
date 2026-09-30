/**
 * Server entry point for quiz content: picks the content source from the environment.
 *
 *   const quiz = await getQuiz(); // the default quiz, or null
 *
 * CONTENT_SOURCE selects the source:
 * - "supabase": the database (production default).
 * - "contentful": Contentful's Delivery API; needs CONTENTFUL_SPACE_ID and CONTENTFUL_DELIVERY_TOKEN.
 * - "fixture": bundled SAMPLE content for local preview (lib/content/fixture-source.ts).
 * - unset, "auto" or "local": Supabase when NEXT_PUBLIC_SUPABASE_URL is set; otherwise, outside
 *   production, the fixture, so `pnpm dev` runs without any Supabase env.
 *
 * Server-only (the sources read server env and next/cache). Client components import types from
 * "@/lib/content/types" and shared constants from "@/lib/content/source" instead.
 */

import { ContentfulContentSource } from "@/lib/content/contentful-source";
import { FixtureContentSource } from "@/lib/content/fixture-source";
import { DEFAULT_QUIZ_SLUG, type ContentSource, type GetQuizOptions } from "@/lib/content/source";
import { SupabaseContentSource } from "@/lib/content/supabase-source";
import type { Quiz } from "@/lib/content/types";

export type ContentSourceKind = "supabase" | "contentful" | "fixture";

const CONTENT_SOURCE_KINDS: readonly ContentSourceKind[] = ["supabase", "contentful", "fixture"];

/** Values that mean "pick for me" (.env.example ships CONTENT_SOURCE=local). */
const AUTO_VALUES = new Set(["", "auto", "local"]);

type Env = Record<string, string | undefined>;

let warnedUnknown: string | undefined;

/** Which source CONTENT_SOURCE (and the Supabase env, when it is unset) selects. */
export function resolveContentSourceKind(env: Env = process.env): ContentSourceKind {
	const requested = env.CONTENT_SOURCE?.trim().toLowerCase() ?? "";
	if ((CONTENT_SOURCE_KINDS as readonly string[]).includes(requested)) {
		return requested as ContentSourceKind;
	}
	if (!AUTO_VALUES.has(requested) && warnedUnknown !== requested) {
		warnedUnknown = requested;
		console.warn(
			`[content] unknown CONTENT_SOURCE="${requested}"; expected ${CONTENT_SOURCE_KINDS.join(", ")}. Picking automatically.`,
		);
	}

	const hasSupabase = Boolean(env.NEXT_PUBLIC_SUPABASE_URL?.trim());
	return !hasSupabase && env.NODE_ENV !== "production" ? "fixture" : "supabase";
}

/** A new source of the given kind. Contentful throws ContentConfigError when it is not configured. */
export function createContentSource(kind: ContentSourceKind): ContentSource {
	switch (kind) {
		case "contentful":
			return new ContentfulContentSource();
		case "fixture":
			return new FixtureContentSource();
		case "supabase":
			return new SupabaseContentSource();
	}
}

let current: { kind: ContentSourceKind; source: ContentSource } | undefined;

/** The configured content source (one instance per process). */
export function getContentSource(): ContentSource {
	const kind = resolveContentSourceKind();
	if (current?.kind === kind) return current.source;

	const source = createContentSource(kind);
	if (kind === "fixture" && process.env.NODE_ENV === "production") {
		console.warn("[content] CONTENT_SOURCE=fixture: serving SAMPLE preview content, not the real quiz");
	}
	current = { kind, source };
	return source;
}

/** A published quiz (the default one without a slug), or null. See ContentSource.getQuiz. */
export function getQuiz(slug: string = DEFAULT_QUIZ_SLUG, opts?: GetQuizOptions): Promise<Quiz | null> {
	return getContentSource().getQuiz(slug, opts);
}

export {
	CONTENT_CACHE_TAG,
	CONTENT_REVALIDATE_SECONDS,
	ContentConfigError,
	ContentSourceError,
	ContentValidationError,
	DEFAULT_QUIZ_ID,
	DEFAULT_QUIZ_SLUG,
	QUIZ_LIST_CACHE_TAG,
	quizCacheTag,
	type ContentSource,
	type GetQuizOptions,
} from "@/lib/content/source";
export { QUIZ_QUESTION_LIMIT, revalidateAllContent, revalidateQuizContent } from "@/lib/content/supabase-source";
export { isRenderableScenario } from "@/lib/content/types";
export type * from "@/lib/content/types";
