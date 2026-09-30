import "server-only";

import { createServerClient } from "@supabase/ssr";
import { revalidateTag, unstable_cache } from "next/cache";
import { z } from "zod";
import {
	LEGACY_QUIZ_META,
	legacyQuestionRowSchema,
	legacyRowsToQuestions,
	type LegacyQuestionRow,
} from "@/lib/content/legacy";
import { isValidQuizSlug } from "@/lib/content/schema";
import {
	CONTENT_CACHE_TAG,
	CONTENT_REVALIDATE_SECONDS,
	ContentConfigError,
	ContentSourceError,
	DEFAULT_QUIZ_SLUG,
	QUIZ_LIST_CACHE_TAG,
	finalizeQuiz,
	quizCacheTag,
	type ContentSource,
} from "@/lib/content/source";
import {
	DEFAULT_LOCALE,
	LOCALES,
	QUIZ_STATUSES,
	type Quiz,
	type QuizSummary,
} from "@/lib/content/types";

const SOURCE = "supabase";

/** The quiz has always shown at most 10 questions (app/(main)/quiz/page.tsx). */
export const QUIZ_QUESTION_LIMIT = 10;

type QuizMeta = Omit<Quiz, "questions">;

/**
 * Supabase client without cookies. Content is public and cached for every visitor, so it is read
 * as the anon role: a signed-in admin's session must never end up in the shared cache, and Next.js
 * does not allow cookies() inside unstable_cache anyway. That is why this does not call
 * fetchQuizQuestions() (lib/actions/questions.ts), which reads cookies; it runs the same RPC.
 */
function createContentClient() {
	const env = (name: string) => process.env[name]?.trim() || undefined;
	const url = env("NEXT_PUBLIC_SUPABASE_URL");
	// Same key precedence as utils/supabase/server.ts.
	const key =
		(process.env.NODE_ENV === "development"
			? env("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY")
			: env("NEXT_PUBLIC_SUPABASE_ANON_KEY")) ??
		env("NEXT_PUBLIC_SUPABASE_ANON_KEY") ??
		env("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY");

	if (!url || !key) {
		throw new ContentConfigError(
			SOURCE,
			"set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY), " +
				"or use CONTENT_SOURCE=fixture for a local preview",
		);
	}

	return createServerClient(url, key, {
		cookies: {
			getAll: () => [],
			setAll: () => {},
		},
	});
}

export type ContentDbClient = Pick<ReturnType<typeof createContentClient>, "from" | "rpc">;

/** quizzes rows (09-content-model.sql). */
const quizRowSchema = z.object({
	id: z.string().min(1),
	slug: z.string(),
	title: z.string(),
	description: z.string().nullable(),
	locale: z.enum(LOCALES).catch(DEFAULT_LOCALE),
	status: z.enum(QUIZ_STATUSES),
	version: z.number().int().min(1).catch(1),
});

const QUIZ_COLUMNS = "id, slug, title, description, locale, status, version";

function toQuizMeta(row: z.infer<typeof quizRowSchema>): QuizMeta {
	return { ...row, description: row.description ?? "" };
}

/** Before 09-content-model.sql runs there is no quizzes table. */
function isMissingTable(error: { code?: string }): boolean {
	// 42P01 = undefined_table (Postgres); PGRST205 = table not in PostgREST's schema cache.
	return error.code === "42P01" || error.code === "PGRST205";
}

/** Whether a question row belongs to a quiz. Rows without quiz_id predate the migration. */
function belongsTo(row: LegacyQuestionRow, quiz: QuizMeta): boolean {
	if (row.quiz_id) return row.quiz_id === quiz.id;
	return quiz.slug === DEFAULT_QUIZ_SLUG;
}

export type SupabaseContentSourceOptions = {
	/** Injects the database client (tests). Defaults to an anon client from the environment. */
	client?: () => ContentDbClient;
	/** Cache results with unstable_cache (default true). */
	cache?: boolean;
};

/**
 * Quiz content from Supabase: today's questions/answers tables through get_questions_with_answers(),
 * mapped by lib/content/legacy.ts, and quiz metadata from the quizzes table once it exists.
 */
export class SupabaseContentSource implements ContentSource {
	readonly name = SOURCE;
	private readonly client: () => ContentDbClient;
	private readonly cache: boolean;

	constructor(options: SupabaseContentSourceOptions = {}) {
		this.client = options.client ?? createContentClient;
		this.cache = options.cache ?? true;
	}

	/** Supabase content is Thai only, so there is no locale option to honour. */
	async getQuiz(slug: string): Promise<Quiz | null> {
		if (!isValidQuizSlug(slug)) return null;
		if (!this.cache) return this.loadQuiz(slug);
		return unstable_cache(() => this.loadQuiz(slug), ["content", SOURCE, "quiz", slug], {
			tags: [CONTENT_CACHE_TAG, quizCacheTag(slug)],
			revalidate: CONTENT_REVALIDATE_SECONDS,
		})();
	}

	async listQuizzes(): Promise<QuizSummary[]> {
		if (!this.cache) return this.loadQuizList();
		return unstable_cache(() => this.loadQuizList(), ["content", SOURCE, "quizzes"], {
			tags: [CONTENT_CACHE_TAG, QUIZ_LIST_CACHE_TAG],
			revalidate: CONTENT_REVALIDATE_SECONDS,
		})();
	}

	private async loadQuiz(slug: string): Promise<Quiz | null> {
		const client = this.client();
		const meta = await this.fetchQuizMeta(client, slug);
		if (!meta) return null;

		const rows = (await this.fetchQuestionRows(client)).filter((row) => belongsTo(row, meta));
		const questions = legacyRowsToQuestions(rows).slice(0, QUIZ_QUESTION_LIMIT);
		return finalizeQuiz(SOURCE, slug, { ...meta, questions });
	}

	private async loadQuizList(): Promise<QuizSummary[]> {
		const client = this.client();
		const [quizzes, rows] = await Promise.all([
			this.fetchPublishedQuizzes(client),
			this.fetchQuestionRows(client),
		]);
		return quizzes.map((quiz) => ({
			...quiz,
			questionCount: Math.min(
				rows.filter((row) => belongsTo(row, quiz)).length,
				QUIZ_QUESTION_LIMIT,
			),
		}));
	}

	private async fetchQuizMeta(client: ContentDbClient, slug: string): Promise<QuizMeta | null> {
		const { data, error } = await client
			.from("quizzes")
			.select(QUIZ_COLUMNS)
			.eq("slug", slug)
			.eq("status", "published")
			.maybeSingle();

		if (error) {
			if (isMissingTable(error)) return slug === DEFAULT_QUIZ_SLUG ? { ...LEGACY_QUIZ_META } : null;
			throw new ContentSourceError(SOURCE, `reading quiz "${slug}" failed: ${error.message}`, {
				cause: error,
			});
		}
		if (!data) return null;

		const parsed = quizRowSchema.safeParse(data);
		if (!parsed.success) {
			throw new ContentSourceError(SOURCE, `quiz "${slug}" has an unexpected row shape`);
		}
		return toQuizMeta(parsed.data);
	}

	private async fetchPublishedQuizzes(client: ContentDbClient): Promise<QuizMeta[]> {
		const { data, error } = await client
			.from("quizzes")
			.select(QUIZ_COLUMNS)
			.eq("status", "published")
			.order("slug");

		if (error) {
			if (isMissingTable(error)) return [{ ...LEGACY_QUIZ_META }];
			throw new ContentSourceError(SOURCE, `listing quizzes failed: ${error.message}`, {
				cause: error,
			});
		}

		return (Array.isArray(data) ? data : []).flatMap((row: unknown) => {
			const parsed = quizRowSchema.safeParse(row);
			return parsed.success && isValidQuizSlug(parsed.data.slug) ? [toQuizMeta(parsed.data)] : [];
		});
	}

	private async fetchQuestionRows(client: ContentDbClient): Promise<LegacyQuestionRow[]> {
		const { data, error } = await client.rpc("get_questions_with_answers");
		if (error) {
			throw new ContentSourceError(SOURCE, `get_questions_with_answers failed: ${error.message}`, {
				cause: error,
			});
		}

		return (Array.isArray(data) ? data : []).flatMap((row: unknown) => {
			const parsed = legacyQuestionRowSchema.safeParse(row);
			return parsed.success ? [parsed.data as LegacyQuestionRow] : [];
		});
	}
}

/**
 * Drops the cached copy of one quiz (and the quiz list) so the next request reads fresh content.
 * Call it from a Server Action or route handler after the quiz's questions, answers or red flags
 * change (admin edits, a CMS publish webhook). Expires immediately rather than serving one stale
 * response, so an editor sees the change on the next reload.
 */
export function revalidateQuizContent(slug: string = DEFAULT_QUIZ_SLUG): void {
	revalidateTag(quizCacheTag(slug), { expire: 0 });
	revalidateTag(QUIZ_LIST_CACHE_TAG, { expire: 0 });
}

/** Drops every cached piece of content from every source. */
export function revalidateAllContent(): void {
	revalidateTag(CONTENT_CACHE_TAG, { expire: 0 });
}
