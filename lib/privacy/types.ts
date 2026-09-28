/**
 * Result types of the privacy Server Actions (lib/actions/privacy.ts, lib/actions/survey.ts).
 * Kept outside the "use server" modules, which may only export async functions.
 */

import type { ClientStorageKeys, ConsentPurposeId } from "@/lib/privacy/policy";
import type { SurveyFieldErrors } from "@/lib/privacy/survey";

/** Why a privacy action did nothing. Every code comes with a Thai `message` ready to show. */
export type PrivacyErrorCode =
	| "invalid_input"
	/** The anon token is missing, forged or expired, so the caller cannot be identified. */
	| "invalid_identity"
	| "rate_limited"
	/** The page showed an older privacy notice than the one in force: reload and ask again. */
	| "policy_outdated"
	| "server_error";

export type PrivacyFailure = {
	ok: false;
	code: PrivacyErrorCode;
	message: string;
	/** Present with "rate_limited". */
	retryAfterSeconds?: number;
};

// --- recordConsent / withdrawConsent ---------------------------------------------------------

export type RecordConsentInput = {
	/** Anon JWT from getAnonToken() / getCachedAnonToken(). */
	token: string;
	purpose: ConsentPurposeId;
	/** false = withdraw (same as withdrawConsent). */
	granted: boolean;
	/** POLICY_VERSION the user saw. Must equal the current one to grant consent. */
	policyVersion: string;
};

export type WithdrawConsentInput = {
	token: string;
	purpose: ConsentPurposeId;
};

export type ConsentActionResult =
	| {
			ok: true;
			purpose: ConsentPurposeId;
			granted: boolean;
			policyVersion: string;
			/** false when the log already said the same thing (the call was a no-op). */
			changed: boolean;
			/** Rows deleted because consent was withdrawn (0 when granting). */
			dataErased: number;
			message: string;
	  }
	| PrivacyFailure;

// --- eraseMyData -----------------------------------------------------------------------------

export type EraseMyDataInput = {
	/** Anon JWT of this tab, or null when there is none (then only local data is cleared). */
	token?: string | null;
};

export type ErasureCounts = {
	quizSessions: number;
	questionResponses: number;
	surveyResponses: number;
	consentRecords: number;
};

export type EraseMyDataResult =
	| {
			ok: true;
			/** "no_identity": nothing on the server can be linked to this browser any more. */
			code: "erased" | "no_identity";
			erased: ErasureCounts | null;
			/** Keys the client must remove now (then call clearAnonToken()). */
			clearLocalKeys: ClientStorageKeys;
			message: string;
	  }
	| PrivacyFailure;

// --- submitSurveyAction ----------------------------------------------------------------------

export type SurveyResultCode =
	/** Demographics stored (for minors: the age band only). */
	| "stored"
	/** No consent for demographics: nothing personal was processed. Not an error. */
	| "not_stored"
	/** Consent given but there is no verifiable quiz session to attach it to. */
	| "no_session"
	| "invalid_input"
	| "rate_limited"
	| "policy_outdated"
	| "server_error";

/** useActionState state of submitSurveyAction; `{ success: false, message: "" }` is a valid initial state. */
export type SurveyActionState = {
	success: boolean;
	message: string;
	code?: SurveyResultCode;
	/** Whether any demographic data was written. */
	stored?: boolean;
	/** The age band was under 20, so only the age band was kept. */
	minor?: boolean;
	fieldErrors?: SurveyFieldErrors;
	retryAfterSeconds?: number;
};
