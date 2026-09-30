/**
 * The contract every content source implements (Supabase today, Contentful when enabled, and the
 * local preview fixture), plus the pieces they share: cache tags, errors and final validation.
 */

import { validateQuiz } from "@/lib/content/schema";
import type { Locale, Quiz, QuizSummary } from "@/lib/content/types";

/** The quiz the site has always served. */
export const DEFAULT_QUIZ_SLUG = "scam-awareness";

/**
 * Fixed id of the default quiz. 09-content-model.sql inserts the quizzes row with this id, so the
 * id stays the same before and after the migration runs.
 */
export const DEFAULT_QUIZ_ID = "e7f40430-ba10-47ca-8265-03a04312d198";

/** How long cached content may be served before it is fetched again (seconds). */
export const CONTENT_REVALIDATE_SECONDS = 3600;

/** Cache tag on everything any content source caches. */
export const CONTENT_CACHE_TAG = "content";

/** Cache tag on one quiz's content. */
export function quizCacheTag(slug: string): string {
	return `${CONTENT_CACHE_TAG}:quiz:${slug}`;
}

/** Cache tag on the list of quizzes. */
export const QUIZ_LIST_CACHE_TAG = `${CONTENT_CACHE_TAG}:quizzes`;

export type GetQuizOptions = {
	/**
	 * Preferred locale. Sources without localized copies return the quiz in the only locale they
	 * have, so check `quiz.locale` on the result.
	 */
	locale?: Locale;
};

export interface ContentSource {
	/** Short name for logs, e.g. "supabase". */
	readonly name: string;
	/**
	 * A published quiz with its questions sorted by `order`, or null when there is no published
	 * quiz with this slug (or it has no valid questions). Throws ContentSourceError when the source
	 * cannot be reached, so a failure is never cached as "not found".
	 */
	getQuiz(slug: string, opts?: GetQuizOptions): Promise<Quiz | null>;
	/** Published quizzes. */
	listQuizzes(): Promise<QuizSummary[]>;
}

/** The source could not deliver content (network, HTTP or database error). */
export class ContentSourceError extends Error {
	readonly source: string;

	constructor(source: string, message: string, options?: { cause?: unknown }) {
		super(`[content:${source}] ${message}`, options);
		this.name = "ContentSourceError";
		this.source = source;
	}
}

/** The source is selected but not configured (missing or malformed environment variables). */
export class ContentConfigError extends ContentSourceError {
	constructor(source: string, message: string) {
		super(source, message);
		this.name = "ContentConfigError";
	}
}

/** The source answered, but the quiz itself (not just some questions) is invalid. */
export class ContentValidationError extends ContentSourceError {
	readonly issues: string[];

	constructor(source: string, slug: string, issues: string[]) {
		super(source, `quiz "${slug}" is invalid: ${issues.join("; ")}`);
		this.name = "ContentValidationError";
		this.issues = issues;
	}
}

/**
 * Last step of every source: validates a mapped quiz, logs and drops invalid questions, and
 * returns null when no valid question is left.
 */
export function finalizeQuiz(source: string, slug: string, raw: unknown): Quiz | null {
	const result = validateQuiz(raw);
	if (!result.success) {
		throw new ContentValidationError(source, slug, result.issues);
	}
	for (const dropped of result.dropped) {
		console.error(
			`[content:${source}] dropped question ${dropped.id ?? `#${dropped.index + 1}`} of quiz "${slug}":`,
			dropped.issues.join("; "),
		);
	}
	return result.quiz.questions.length > 0 ? result.quiz : null;
}
