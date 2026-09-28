import {
	AGE_BAND_VALUES,
	GENDER_VALUES,
	MINOR_AGE_BANDS,
	NOT_SPECIFIED,
	isMinorAgeBand,
	minimiseDemographics,
	parseSurveyForm,
	surveyFieldErrors,
	surveySubmissionSchema,
	toSurveyRow,
	type AgeBand,
} from "@/lib/privacy/survey";
import { POLICY_VERSION, consentFieldName } from "@/lib/privacy/policy";

const TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJhbm9uX3VzZXJfaWQiOiJhYmMifQ.c2lnbmF0dXJl";
const SESSION_ID = "0b8f7c1e-2d4a-4c9b-9a51-3f2e8d7c6b5a";

const ADULT_ANSWERS = {
	ageBand: "25-34",
	gender: "female",
	province: "เชียงใหม่",
	education: "bachelor",
	occupation: "private",
};

function parse(input: Record<string, unknown>) {
	return surveySubmissionSchema.safeParse(input);
}

describe("surveySubmissionSchema — consent", () => {
	it("drops every demographic field when consent is off", () => {
		const result = parse({ ...ADULT_ANSWERS, token: TOKEN, quizSessionId: SESSION_ID });

		expect(result.success).toBe(true);
		if (!result.success) return;
		expect(result.data.consent).toBe(false);
		expect(result.data.demographics).toBeNull();
		expect(JSON.stringify(result.data)).not.toContain("เชียงใหม่");
	});

	it("does not even validate demographics without consent", () => {
		const result = parse({ ageBand: "1990-01-01", province: "Bangkok", gender: 42 });

		expect(result.success).toBe(true);
		if (result.success) expect(result.data.demographics).toBeNull();
	});

	it.each([undefined, null, "", "false", "off", "no", "denied", "GRANTED?", 1])(
		"treats %p as no consent",
		(flag) => {
			const result = parse({ ...ADULT_ANSWERS, consent: flag });
			expect(result.success && result.data.consent).toBe(false);
		},
	);

	it.each(["granted", "GRANTED", "true", "on", true])("accepts %p as an explicit opt-in", (flag) => {
		const result = parse({ ...ADULT_ANSWERS, consent: flag });
		expect(result.success && result.data.consent).toBe(true);
	});
});

describe("surveySubmissionSchema — adults", () => {
	it("keeps the full, closed-list answers", () => {
		const result = parse({ ...ADULT_ANSWERS, consent: "granted" });

		expect(result.success).toBe(true);
		if (!result.success) return;
		expect(result.data.demographics).toEqual({ minor: false, ...ADULT_ANSWERS });
	});

	it("reads blank and legacy 'not_specified' answers as not answered", () => {
		const result = parse({
			consent: "granted",
			ageBand: "45-54",
			gender: "",
			province: "   ",
			education: NOT_SPECIFIED,
			occupation: null,
		});

		expect(result.success).toBe(true);
		if (result.success) expect(result.data.demographics).toEqual({ minor: false, ageBand: "45-54" });
	});

	it("accepts ไม่ระบุ as a gender answer", () => {
		const result = parse({ consent: "granted", ageBand: "65+", gender: "unspecified" });
		expect(result.success && result.data.demographics).toEqual({
			minor: false,
			ageBand: "65+",
			gender: "unspecified",
		});
	});
});

describe("surveySubmissionSchema — data minimisation", () => {
	it("rejects a date of birth instead of an age band", () => {
		const result = parse({ consent: "granted", ageBand: "2008-05-01" });

		expect(result.success).toBe(false);
		if (!result.success) expect(surveyFieldErrors(result.error)).toEqual({ ageBand: "กรุณาเลือกช่วงอายุ" });
	});

	it("requires an age band once consent is given", () => {
		const result = parse({ consent: "granted", gender: "male" });
		expect(result.success).toBe(false);
		if (!result.success) expect(surveyFieldErrors(result.error).ageBand).toBe("กรุณาเลือกช่วงอายุ");
	});

	it.each(["Bangkok", "กรุงเทพ", "เขตบางรัก กรุงเทพมหานคร", "10500"])(
		"only accepts a province from the closed list (%p)",
		(province) => {
			const result = parse({ consent: "granted", ageBand: "25-34", province });
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(surveyFieldErrors(result.error).province).toBe("กรุณาเลือกจังหวัดจากรายการ");
			}
		},
	);

	it("rejects free text in the closed-choice fields", () => {
		const result = parse({
			consent: "granted",
			ageBand: "25-34",
			gender: "LGBTQ+",
			education: "มหาวิทยาลัยเชียงใหม่",
			occupation: "ครูโรงเรียนบ้านหนองบัว",
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(Object.keys(surveyFieldErrors(result.error)).sort()).toEqual([
				"education",
				"gender",
				"occupation",
			]);
		}
	});

	it("offers no sexual-orientation options (would be sensitive data, s.26)", () => {
		expect([...GENDER_VALUES]).toEqual(["female", "male", "other", "unspecified"]);
	});
});

describe("surveySubmissionSchema — minors (PDPA s.20)", () => {
	it.each(MINOR_AGE_BANDS)("keeps only the age band for %s", (ageBand) => {
		const result = parse({ ...ADULT_ANSWERS, ageBand, consent: "granted" });

		expect(result.success).toBe(true);
		if (result.success) expect(result.data.demographics).toEqual({ minor: true, ageBand });
	});

	it("drops a minor's other answers unread, even invalid ones", () => {
		const result = parse({ consent: "granted", ageBand: "under-15", province: "Bangkok", gender: 42 });

		expect(result.success).toBe(true);
		if (result.success) expect(result.data.demographics).toEqual({ minor: true, ageBand: "under-15" });
	});

	it("flags exactly the bands whose upper age is under 20", () => {
		const upperAge = (band: AgeBand) => {
			if (band.startsWith("under-")) return Number(band.slice("under-".length)) - 1;
			if (band.endsWith("+")) return Number.POSITIVE_INFINITY;
			return Number(band.split("-")[1]);
		};

		for (const band of AGE_BAND_VALUES) {
			expect([band, isMinorAgeBand(band)]).toEqual([band, upperAge(band) < 20]);
		}
		expect(MINOR_AGE_BANDS.length).toBeGreaterThan(0);
	});

	it("builds a database row with nothing but the age band", () => {
		const demographics = minimiseDemographics({
			ageBand: "15-19",
			gender: "male",
			province: "ขอนแก่น",
			education: "secondary",
			occupation: "student",
		});

		expect(
			toSurveyRow(demographics, {
				quizSessionId: SESSION_ID,
				policyVersion: POLICY_VERSION,
				submittedAt: "2026-09-28T03:00:00.000Z",
			}),
		).toEqual({
			quiz_session_id: SESSION_ID,
			age_group: "15-19",
			gender: null,
			province: null,
			education: NOT_SPECIFIED,
			occupation: NOT_SPECIFIED,
			policy_version: POLICY_VERSION,
			submitted_at: "2026-09-28T03:00:00.000Z",
		});
	});
});

describe("submission context", () => {
	it("passes a well-formed token, session id and policy version through", () => {
		const result = parse({ consent: "granted", ageBand: "20-24", token: TOKEN, quizSessionId: SESSION_ID, policyVersion: POLICY_VERSION });
		expect(result.success).toBe(true);
		if (!result.success) return;
		expect(result.data).toMatchObject({ token: TOKEN, quizSessionId: SESSION_ID, policyVersion: POLICY_VERSION });
	});

	it("reads a malformed token or session id as missing instead of failing", () => {
		const result = parse({ token: "not-a-jwt", quizSessionId: "quiz_1727500000_abc", policyVersion: "v1" });
		expect(result.success).toBe(true);
		if (!result.success) return;
		expect(result.data.token).toBeUndefined();
		expect(result.data.quizSessionId).toBeUndefined();
		expect(result.data.policyVersion).toBeUndefined();
	});
});

describe("parseSurveyForm", () => {
	it("reads ConsentPanel's switch (namePrefix 'consent_') and the answer fields", () => {
		const form = new FormData();
		form.set(consentFieldName("demographics"), "granted");
		form.set("token", TOKEN);
		form.set("quizSessionId", SESSION_ID);
		form.set("ageBand", "35-44");
		form.set("province", "สงขลา");

		const result = parseSurveyForm(form);
		expect(result.success).toBe(true);
		if (!result.success) return;
		expect(result.data.consent).toBe(true);
		expect(result.data.demographics).toEqual({ minor: false, ageBand: "35-44", province: "สงขลา" });
	});

	it("handles the legacy survey form (no consent field) without storing anything", () => {
		const form = new FormData();
		form.set("ageGroup", "25-34");
		form.set("education", "bachelor");
		form.set("occupation", "private");
		form.set("totalScore", "7");
		form.set("totalQuestions", "10");

		const result = parseSurveyForm(form);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.consent).toBe(false);
			expect(result.data.demographics).toBeNull();
		}
	});
});
