/**
 * Server-side PDPA enforcement in the Server Actions, against a fake Supabase:
 * consent before storage, minors, identity from the database (never from the client), erasure.
 */
import { createServerClientWithToken } from "@/utils/supabase/server-with-token";
import { createAdminClient } from "@/utils/supabase/admin";
import { eraseMyData, recordConsent, withdrawConsent } from "@/lib/actions/privacy";
import { submitSurveyAction } from "@/lib/actions/survey";
import { POLICY_VERSION, consentFieldName } from "@/lib/privacy/policy";

jest.mock("server-only", () => ({}));
jest.mock("@/utils/supabase/server-with-token", () => ({ createServerClientWithToken: jest.fn() }));
jest.mock("@/utils/supabase/admin", () => ({ createAdminClient: jest.fn() }));

const mockedTokenClient = createServerClientWithToken as jest.MockedFunction<
	typeof createServerClientWithToken
>;
const mockedAdminClient = createAdminClient as jest.MockedFunction<typeof createAdminClient>;

const TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJhbm9uX3VzZXJfaWQiOiJhYmMifQ.c2lnbmF0dXJl";
const SESSION_ID = "0b8f7c1e-2d4a-4c9b-9a51-3f2e8d7c6b5a";

type Result = { data: unknown; error: unknown; status?: number };
type Event = { client: "anon" | "admin"; op: string; target: string; payload?: unknown };

/** Chainable query whose terminal call resolves to `result`. */
function query(result: () => Result) {
	const chain: Record<string, unknown> = {};
	for (const method of ["select", "eq", "order", "limit"]) chain[method] = () => chain;
	chain.maybeSingle = async () => result();
	return chain;
}

let subjectCounter = 0;

function setup(options: {
	identity?: Result;
	ownsSession?: boolean;
	latestConsent?: { granted: boolean; policy_version: string; created_at: string } | null;
	consentInsertError?: unknown;
	eraseResult?: Result;
} = {}) {
	subjectCounter += 1;
	const subject = `user_subject-${subjectCounter}`;
	const events: Event[] = [];

	const anon = {
		rpc: jest.fn(async (fn: string) => {
			events.push({ client: "anon", op: "rpc", target: fn });
			return options.identity ?? { data: subject, error: null, status: 200 };
		}),
		from: jest.fn((table: string) => ({
			...query(() => {
				if (table === "quiz_sessions") {
					return { data: options.ownsSession === false ? null : { id: SESSION_ID }, error: null };
				}
				return { data: options.latestConsent ?? null, error: null };
			}),
			insert: async (payload: unknown) => {
				events.push({ client: "anon", op: "insert", target: table, payload });
				return { error: options.consentInsertError ?? null };
			},
		})),
	};

	const admin = {
		rpc: jest.fn(async (fn: string, args: unknown) => {
			events.push({ client: "admin", op: "rpc", target: fn, payload: args });
			if (fn === "pdpa_erase_demographics") return { data: 1, error: null };
			return (
				options.eraseResult ?? {
					data: { quiz_sessions: 2, question_responses: 20, survey_responses: 1, consent_records: 1, legacy_rows: 0 },
					error: null,
				}
			);
		}),
		from: jest.fn((table: string) => ({
			...query(() => ({ data: null, error: null })),
			insert: async (payload: unknown) => {
				events.push({ client: "admin", op: "insert", target: table, payload });
				return { error: null };
			},
			update: (payload: unknown) => ({
				eq: async () => {
					events.push({ client: "admin", op: "update", target: table, payload });
					return { error: null };
				},
			}),
		})),
	};

	mockedTokenClient.mockReturnValue(anon as unknown as ReturnType<typeof createServerClientWithToken>);
	mockedAdminClient.mockReturnValue(admin as unknown as ReturnType<typeof createAdminClient>);

	return { subject, events, anon, admin };
}

function surveyForm(fields: Record<string, string>) {
	const form = new FormData();
	for (const [name, value] of Object.entries(fields)) form.set(name, value);
	return form;
}

const CONSENTED_ADULT = {
	[consentFieldName("demographics")]: "granted",
	token: TOKEN,
	quizSessionId: SESSION_ID,
	policyVersion: POLICY_VERSION,
	ageBand: "25-34",
	gender: "female",
	province: "เชียงใหม่",
	education: "bachelor",
	occupation: "private",
};

let errorSpy: jest.SpyInstance;

beforeEach(() => {
	mockedTokenClient.mockReset();
	mockedAdminClient.mockReset();
	errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
	errorSpy.mockRestore();
});

describe("submitSurveyAction", () => {
	it("stores nothing and touches no database without consent", async () => {
		setup();
		const withoutConsent = { ...CONSENTED_ADULT };
		delete withoutConsent[consentFieldName("demographics")];

		const state = await submitSurveyAction(undefined, surveyForm(withoutConsent));

		expect(state).toMatchObject({ success: true, stored: false, code: "not_stored" });
		expect(mockedTokenClient).not.toHaveBeenCalled();
		expect(mockedAdminClient).not.toHaveBeenCalled();
	});

	it("records the consent with POLICY_VERSION before writing the answers", async () => {
		const { subject, events } = setup();

		const state = await submitSurveyAction(undefined, surveyForm(CONSENTED_ADULT));

		expect(state).toMatchObject({ success: true, stored: true, minor: false, code: "stored" });
		const writes = events.filter((event) => event.op !== "rpc");
		expect(writes.map((event) => `${event.client}:${event.op}:${event.target}`)).toEqual([
			"anon:insert:pdpa_consent_log",
			"admin:insert:survey_responses",
		]);
		expect(writes[0].payload).toEqual({
			anonymous_user_id: subject,
			purpose: "demographics",
			granted: true,
			policy_version: POLICY_VERSION,
		});
		expect(writes[1].payload).toMatchObject({
			quiz_session_id: SESSION_ID,
			age_group: "25-34",
			gender: "female",
			province: "เชียงใหม่",
			education: "bachelor",
			occupation: "private",
			policy_version: POLICY_VERSION,
		});
	});

	it("does not log the consent again when it is already on record for this version", async () => {
		const { events } = setup({
			latestConsent: { granted: true, policy_version: POLICY_VERSION, created_at: "2026-09-28T01:00:00Z" },
		});

		await submitSurveyAction(undefined, surveyForm(CONSENTED_ADULT));

		expect(events.filter((event) => event.target === "pdpa_consent_log")).toHaveLength(0);
		expect(events.some((event) => event.target === "survey_responses")).toBe(true);
	});

	it.each(["under-15", "15-19"])(
		"stores nothing and logs no consent for a minor (%s, s.20)",
		async (ageBand) => {
			const { events } = setup();

			const state = await submitSurveyAction(undefined, surveyForm({ ...CONSENTED_ADULT, ageBand }));

			expect(state).toMatchObject({ success: true, stored: false, minor: true, code: "not_stored" });
			expect(events).toEqual([]);
			expect(mockedTokenClient).not.toHaveBeenCalled();
			expect(mockedAdminClient).not.toHaveBeenCalled();
		},
	);

	it("refuses a quiz session the caller does not own", async () => {
		const { events } = setup({ ownsSession: false });

		const state = await submitSurveyAction(undefined, surveyForm(CONSENTED_ADULT));

		expect(state).toMatchObject({ success: false, stored: false, code: "no_session" });
		expect(events.filter((event) => event.op !== "rpc")).toHaveLength(0);
		expect(mockedAdminClient).not.toHaveBeenCalled();
	});

	it("stores nothing when the consent cannot be recorded", async () => {
		setup({ consentInsertError: { code: "42501" } });

		const state = await submitSurveyAction(undefined, surveyForm(CONSENTED_ADULT));

		expect(state).toMatchObject({ success: false, stored: false, code: "server_error" });
		expect(mockedAdminClient).not.toHaveBeenCalled();
	});

	it("treats a token PostgREST rejects as no session", async () => {
		setup({ identity: { data: null, error: { code: "PGRST301" }, status: 401 } });

		const state = await submitSurveyAction(undefined, surveyForm(CONSENTED_ADULT));

		expect(state).toMatchObject({ success: false, code: "no_session" });
		expect(mockedAdminClient).not.toHaveBeenCalled();
	});

	it("asks for a reload when consent was given under an older notice", async () => {
		setup();

		const state = await submitSurveyAction(
			undefined,
			surveyForm({ ...CONSENTED_ADULT, policyVersion: "2025-01-01" }),
		);

		expect(state).toMatchObject({ success: false, code: "policy_outdated" });
		expect(mockedTokenClient).not.toHaveBeenCalled();
	});

	it("returns field errors for invalid answers", async () => {
		setup();

		const state = await submitSurveyAction(undefined, surveyForm({ ...CONSENTED_ADULT, province: "Bangkok" }));

		expect(state).toMatchObject({ success: false, code: "invalid_input" });
		expect(state.fieldErrors).toEqual({ province: "กรุณาเลือกจังหวัดจากรายการ" });
	});
});

describe("recordConsent / withdrawConsent", () => {
	it("refuses consent given under an outdated notice", async () => {
		const { events } = setup();

		const result = await recordConsent({
			token: TOKEN,
			purpose: "demographics",
			granted: true,
			policyVersion: "2025-01-01",
		});

		expect(result).toMatchObject({ ok: false, code: "policy_outdated" });
		expect(events).toHaveLength(0);
	});

	it("rejects malformed input before any database call", async () => {
		setup();

		const result = await recordConsent({
			token: "nope",
			purpose: "marketing" as "demographics",
			granted: true,
			policyVersion: POLICY_VERSION,
		});

		expect(result).toMatchObject({ ok: false, code: "invalid_input" });
		expect(mockedTokenClient).not.toHaveBeenCalled();
	});

	it("appends a withdrawal and deletes the demographics held under the consent", async () => {
		const { subject, events } = setup({
			latestConsent: { granted: true, policy_version: POLICY_VERSION, created_at: "2026-09-28T01:00:00Z" },
		});

		const result = await withdrawConsent({ token: TOKEN, purpose: "demographics" });

		expect(result).toMatchObject({ ok: true, granted: false, changed: true, dataErased: 1 });
		expect(events.find((event) => event.target === "pdpa_consent_log")?.payload).toMatchObject({
			anonymous_user_id: subject,
			granted: false,
		});
		expect(events.find((event) => event.target === "pdpa_erase_demographics")?.payload).toEqual({
			p_anonymous_user_id: subject,
		});
	});
});

describe("eraseMyData", () => {
	it("without a token clears only this browser", async () => {
		setup();

		const result = await eraseMyData({ token: null });

		expect(result).toMatchObject({
			ok: true,
			code: "no_identity",
			erased: null,
			clearLocalKeys: { localStorage: ["scan_jone_anonymous_user"], sessionStorage: ["anon_jwt_cache"] },
		});
		expect(mockedTokenClient).not.toHaveBeenCalled();
		expect(mockedAdminClient).not.toHaveBeenCalled();
	});

	it("erases the subject the database verified, never one the client names", async () => {
		const { subject, admin } = setup();

		const result = await eraseMyData({ token: TOKEN });

		expect(admin.rpc).toHaveBeenCalledWith("pdpa_erase_subject", { p_anonymous_user_id: subject });
		expect(result).toMatchObject({
			ok: true,
			code: "erased",
			erased: { quizSessions: 2, questionResponses: 20, surveyResponses: 1, consentRecords: 1 },
		});
	});

	it("fails without clearing anything when the erasure fails, so the client can retry", async () => {
		setup({ eraseResult: { data: null, error: { code: "57014" } } });

		const result = await eraseMyData({ token: TOKEN });

		expect(result).toEqual({
			ok: false,
			code: "server_error",
			message: expect.any(String),
		});
	});

	it("reports no linkable data when the token is expired or forged", async () => {
		const { admin } = setup({ identity: { data: null, error: { code: "PGRST303" }, status: 401 } });

		const result = await eraseMyData({ token: TOKEN });

		expect(result).toMatchObject({ ok: true, code: "no_identity" });
		expect(admin.rpc).not.toHaveBeenCalled();
	});
});
