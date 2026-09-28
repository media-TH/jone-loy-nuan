/**
 * Who is calling? The anonymous identity behind a privacy Server Action.
 *
 * Same trust model as the quiz actions (lib/actions/quiz.ts, question-responses.ts): the client
 * sends the anon JWT it got from issue-anon-jwt (lib/services/anon-jwt.service.ts) and the server
 * talks to Supabase *as that token*. Instead of decoding the JWT here (we do not hold the signing
 * secret), we ask the database: PostgREST verifies the signature and expiry before any SQL runs,
 * and public.pdpa_current_subject() returns the `anon_user_id` claim normalised to the stored
 * `user_<id>` form. A forged or expired token never gets that far.
 */

import "server-only";

import { createServerClientWithToken } from "@/utils/supabase/server-with-token";

export type AnonClient = ReturnType<typeof createServerClientWithToken>;

export type AnonIdentity = {
	/** anonymous_user_id as stored in quiz_sessions / pdpa_consent_log ("user_<id>"). */
	subjectId: string;
	/** Supabase client authenticated as the caller: RLS limits it to the caller's own rows. */
	client: AnonClient;
};

export type IdentityResult =
	| { ok: true; identity: AnonIdentity }
	| { ok: false; code: "invalid_identity" | "server_error" };

const SUBJECT_ID = /^user_[A-Za-z0-9_-]{1,200}$/;

/** Mirrors enforce_user_prefix_quiz_sessions() (migration 04): ids are stored as "user_<id>". */
export function toSubjectId(anonUserId: string): string {
	const trimmed = anonUserId.trim();
	return trimmed.startsWith("user_") ? trimmed : `user_${trimmed}`;
}

export function isSubjectId(value: unknown): value is string {
	return typeof value === "string" && SUBJECT_ID.test(value);
}

export async function resolveAnonIdentity(token: string): Promise<IdentityResult> {
	const client = createServerClientWithToken(token);
	const { data, error, status } = await client.rpc("pdpa_current_subject");

	if (error) {
		// 401/403: PostgREST rejected the JWT (bad signature, expired, wrong role).
		if (status === 401 || status === 403) return { ok: false, code: "invalid_identity" };
		console.error("[privacy] pdpa_current_subject failed", { status, code: error.code });
		return { ok: false, code: "server_error" };
	}

	// A valid JWT without an anon_user_id claim (e.g. a staff session) is not a data subject here.
	if (!isSubjectId(data)) return { ok: false, code: "invalid_identity" };

	return { ok: true, identity: { subjectId: data, client } };
}
