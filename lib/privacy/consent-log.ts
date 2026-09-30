/**
 * Reads and appends public.pdpa_consent_log as the caller (anon JWT client).
 *
 * The table is append-only: a withdrawal is a new row with granted = false, never an update. RLS
 * (migration 08) only lets a caller insert and read rows carrying their own anon_user_id, and a
 * trigger stamps created_at with the database clock, so the log cannot be backdated.
 */

import "server-only";

import { POLICY_VERSION, type ConsentPurposeId } from "@/lib/privacy/policy";
import type { AnonClient } from "@/lib/privacy/identity";

const TABLE = "pdpa_consent_log";

export type ConsentState = {
	granted: boolean;
	policyVersion: string;
	createdAt: string;
};

type ConsentRow = { granted: boolean; policy_version: string; created_at: string };

function isConsentRow(value: unknown): value is ConsentRow {
	const row = value as Partial<ConsentRow> | null;
	return (
		row !== null &&
		typeof row === "object" &&
		typeof row.granted === "boolean" &&
		typeof row.policy_version === "string" &&
		typeof row.created_at === "string"
	);
}

/** The caller's most recent decision for a purpose, or null if they never made one. */
export async function readLatestConsent(
	client: AnonClient,
	subjectId: string,
	purpose: ConsentPurposeId,
): Promise<{ ok: true; state: ConsentState | null } | { ok: false }> {
	const { data, error } = await client
		.from(TABLE)
		.select("granted, policy_version, created_at")
		.eq("anonymous_user_id", subjectId)
		.eq("purpose", purpose)
		.order("created_at", { ascending: false })
		.limit(1)
		.maybeSingle();

	if (error) {
		console.error("[privacy] reading the consent log failed", { code: error.code });
		return { ok: false };
	}
	if (!isConsentRow(data)) return { ok: true, state: null };

	return {
		ok: true,
		state: { granted: data.granted, policyVersion: data.policy_version, createdAt: data.created_at },
	};
}

/**
 * Makes the log say `granted` for `purpose` under the current POLICY_VERSION, appending a row only
 * when the latest one says something else (so retries and double submits add nothing).
 * A withdrawal with no earlier grant on record is a no-op: there is nothing to withdraw.
 */
export async function syncConsent(
	client: AnonClient,
	subjectId: string,
	purpose: ConsentPurposeId,
	granted: boolean,
): Promise<{ ok: true; changed: boolean } | { ok: false }> {
	const latest = await readLatestConsent(client, subjectId, purpose);
	if (!latest.ok) return { ok: false };

	const current = latest.state;
	const alreadyGranted = current?.granted === true && current.policyVersion === POLICY_VERSION;
	const nothingToWithdraw = current === null || current.granted === false;
	if (granted ? alreadyGranted : nothingToWithdraw) return { ok: true, changed: false };

	const { error } = await client.from(TABLE).insert({
		anonymous_user_id: subjectId,
		purpose,
		granted,
		policy_version: POLICY_VERSION,
	});

	if (error) {
		console.error("[privacy] appending to the consent log failed", { code: error.code });
		return { ok: false };
	}
	return { ok: true, changed: true };
}
