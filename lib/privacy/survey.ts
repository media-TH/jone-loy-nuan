/**
 * Demographic survey: answer options, validation and data minimisation.
 *
 * PDPA rules applied here (the Server Action in lib/actions/survey.ts adds the database checks):
 * - Consent first (s.19): without the demographics consent flag, every demographic field is dropped
 *   before validation, so nothing about the person is even processed.
 * - Minimisation (s.22): an age band, never a date of birth; a province from the closed list of 77,
 *   never an address; every other field is a closed option list, never free text.
 * - Minors (s.20): anyone in an age band under 20 keeps the age band only.
 * - Sensitive data (s.26): the gender options do not ask about sexual orientation.
 */

import { z } from "zod";
import { consentFieldName } from "@/lib/privacy/policy";
import { THAI_PROVINCES, type Province } from "@/lib/privacy/provinces";
import {
	anonTokenSchema,
	blankToUndefined,
	isGrantedFlag,
	policyVersionSchema,
	quizSessionIdSchema,
} from "@/lib/privacy/schemas";

// ---------------------------------------------------------------------------------------------
// Options (values are stored as-is; labels are the Thai UI copy)
// ---------------------------------------------------------------------------------------------

export type SurveyOption<T extends string> = { value: T; label: string };

export const AGE_BAND_VALUES = [
	"under-15",
	"15-19",
	"20-24",
	"25-34",
	"35-44",
	"45-54",
	"55-64",
	"65+",
] as const;
export type AgeBand = (typeof AGE_BAND_VALUES)[number];

const AGE_BAND_LABELS: Record<AgeBand, string> = {
	"under-15": "ต่ำกว่า 15 ปี",
	"15-19": "15–19 ปี",
	"20-24": "20–24 ปี",
	"25-34": "25–34 ปี",
	"35-44": "35–44 ปี",
	"45-54": "45–54 ปี",
	"55-64": "55–64 ปี",
	"65+": "65 ปีขึ้นไป",
};

/** Under 20 = a minor under the Civil and Commercial Code (sui juris at 20), so PDPA s.20 applies. */
export const MINOR_AGE_BANDS: readonly AgeBand[] = ["under-15", "15-19"];

export function isMinorAgeBand(ageBand: AgeBand): boolean {
	return MINOR_AGE_BANDS.includes(ageBand);
}

export const GENDER_VALUES = ["female", "male", "other", "unspecified"] as const;
export type Gender = (typeof GENDER_VALUES)[number];

const GENDER_LABELS: Record<Gender, string> = {
	female: "หญิง",
	male: "ชาย",
	other: "อื่น ๆ",
	unspecified: "ไม่ระบุ",
};

/** Same values as the legacy survey, so admin analytics keep grouping old and new rows together. */
export const EDUCATION_VALUES = [
	"none",
	"primary",
	"secondary",
	"vocational",
	"bachelor",
	"master",
	"doctorate",
] as const;
export type Education = (typeof EDUCATION_VALUES)[number];

const EDUCATION_LABELS: Record<Education, string> = {
	none: "ไม่มีวุฒิการศึกษา",
	primary: "ประถมศึกษา",
	secondary: "มัธยมศึกษา",
	vocational: "ปวช. / ปวส.",
	bachelor: "ปริญญาตรี",
	master: "ปริญญาโท",
	doctorate: "ปริญญาเอก",
};

export const OCCUPATION_VALUES = [
	"student",
	"government",
	"private",
	"business",
	"freelance",
	"labor",
	"agriculture",
	"retired",
	"unemployed",
	"other",
] as const;
export type Occupation = (typeof OCCUPATION_VALUES)[number];

const OCCUPATION_LABELS: Record<Occupation, string> = {
	student: "นักเรียน / นักศึกษา",
	government: "ข้าราชการ / พนักงานรัฐวิสาหกิจ",
	private: "พนักงานบริษัทเอกชน",
	business: "ธุรกิจส่วนตัว / ค้าขาย",
	freelance: "อาชีพอิสระ / ฟรีแลนซ์",
	labor: "รับจ้างทั่วไป",
	agriculture: "เกษตรกร",
	retired: "เกษียณอายุ",
	unemployed: "ว่างงาน",
	other: "อื่น ๆ",
};

function toOptions<T extends string>(values: readonly T[], labels: Record<T, string>): SurveyOption<T>[] {
	return values.map((value) => ({ value, label: labels[value] }));
}

export const AGE_BAND_OPTIONS = toOptions(AGE_BAND_VALUES, AGE_BAND_LABELS);
export const GENDER_OPTIONS = toOptions(GENDER_VALUES, GENDER_LABELS);
export const EDUCATION_OPTIONS = toOptions(EDUCATION_VALUES, EDUCATION_LABELS);
export const OCCUPATION_OPTIONS = toOptions(OCCUPATION_VALUES, OCCUPATION_LABELS);
export const PROVINCE_OPTIONS: SurveyOption<Province>[] = THAI_PROVINCES.map((province) => ({
	value: province,
	label: province,
}));

/** Placeholder for survey_responses.education / occupation, which are NOT NULL in the database. */
export const NOT_SPECIFIED = "not_specified";

// ---------------------------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------------------------

function optionalChoice<T extends readonly [string, ...string[]]>(values: T, message: string) {
	return z.preprocess(blankToUndefined, z.enum(values, { errorMap: () => ({ message }) }).optional());
}

export const ageBandSchema = z.preprocess(
	blankToUndefined,
	z.enum(AGE_BAND_VALUES, { errorMap: () => ({ message: "กรุณาเลือกช่วงอายุ" }) }),
);

/** Demographic answers. Only the age band is required once someone opts in. */
export const demographicsSchema = z.object({
	ageBand: ageBandSchema,
	gender: optionalChoice(GENDER_VALUES, "กรุณาเลือกเพศจากตัวเลือก"),
	province: optionalChoice(THAI_PROVINCES, "กรุณาเลือกจังหวัดจากรายการ"),
	education: optionalChoice(EDUCATION_VALUES, "กรุณาเลือกระดับการศึกษาจากตัวเลือก"),
	occupation: optionalChoice(OCCUPATION_VALUES, "กรุณาเลือกอาชีพจากตัวเลือก"),
});

export type Demographics = z.infer<typeof demographicsSchema>;

/** What may be stored: everything for adults, the age band alone for minors. */
export type MinimisedDemographics =
	| { minor: true; ageBand: AgeBand }
	| ({ minor: false } & Demographics);

export function minimiseDemographics(demographics: Demographics): MinimisedDemographics {
	if (isMinorAgeBand(demographics.ageBand)) {
		return { minor: true, ageBand: demographics.ageBand };
	}
	return { minor: false, ...demographics };
}

export type SurveyField = keyof Demographics;
const SURVEY_FIELDS: readonly SurveyField[] = ["ageBand", "gender", "province", "education", "occupation"];

/** Session context. Malformed values read as missing: they never make a consent-off skip fail. */
const submissionContextSchema = z.object({
	token: z.preprocess(blankToUndefined, anonTokenSchema.optional()).catch(undefined),
	quizSessionId: z.preprocess(blankToUndefined, quizSessionIdSchema.optional()).catch(undefined),
	policyVersion: z.preprocess(blankToUndefined, policyVersionSchema.optional()).catch(undefined),
});

export type SurveySubmission = z.infer<typeof submissionContextSchema> &
	(
		| { consent: false; demographics: null }
		| { consent: true; demographics: MinimisedDemographics }
	);

/**
 * The whole survey submission. Demographic fields are typed `unknown` on the way in and only
 * validated after the consent check, so a submission without consent never fails on them and
 * never carries them out. The age band is checked next: for a minor the other answers are
 * dropped unread, not validated.
 */
export const surveySubmissionSchema = submissionContextSchema
	.extend({
		consent: z.unknown().transform(isGrantedFlag),
		ageBand: z.unknown(),
		gender: z.unknown(),
		province: z.unknown(),
		education: z.unknown(),
		occupation: z.unknown(),
	})
	.transform((input, ctx): SurveySubmission => {
		const context = {
			token: input.token,
			quizSessionId: input.quizSessionId,
			policyVersion: input.policyVersion,
		};

		if (!input.consent) return { ...context, consent: false, demographics: null };

		const ageBand = ageBandSchema.safeParse(input.ageBand);
		if (!ageBand.success) {
			for (const issue of ageBand.error.issues) {
				ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["ageBand"], message: issue.message });
			}
			return z.NEVER;
		}
		if (isMinorAgeBand(ageBand.data)) {
			return { ...context, consent: true, demographics: { minor: true, ageBand: ageBand.data } };
		}

		const parsed = demographicsSchema.safeParse({
			ageBand: input.ageBand,
			gender: input.gender,
			province: input.province,
			education: input.education,
			occupation: input.occupation,
		});
		if (!parsed.success) {
			for (const issue of parsed.error.issues) {
				ctx.addIssue({ code: z.ZodIssueCode.custom, path: issue.path, message: issue.message });
			}
			return z.NEVER;
		}

		return { ...context, consent: true, demographics: minimiseDemographics(parsed.data) };
	});

/**
 * Maps the survey form to the schema input. Field names:
 * `consent_demographics` (ConsentPanel with namePrefix="consent_"), `token`, `quizSessionId`,
 * `policyVersion`, `ageBand`, `gender`, `province`, `education`, `occupation`.
 * Anything else (e.g. the legacy `ageGroup`, `totalScore`) is ignored.
 */
export function readSurveyForm(formData: FormData): Record<string, unknown> {
	const read = (name: string) => {
		const value = formData.get(name);
		return typeof value === "string" ? value : undefined;
	};

	return {
		consent: read(consentFieldName("demographics")),
		token: read("token"),
		quizSessionId: read("quizSessionId"),
		policyVersion: read("policyVersion"),
		ageBand: read("ageBand"),
		gender: read("gender"),
		province: read("province"),
		education: read("education"),
		occupation: read("occupation"),
	};
}

export function parseSurveyForm(formData: FormData) {
	return surveySubmissionSchema.safeParse(readSurveyForm(formData));
}

export type SurveyFieldErrors = Partial<Record<SurveyField, string>>;

/** First message per demographic field, for inline errors next to each control. */
export function surveyFieldErrors(error: z.ZodError): SurveyFieldErrors {
	const errors: SurveyFieldErrors = {};
	for (const issue of error.issues) {
		const field = issue.path[0];
		if (typeof field === "string" && (SURVEY_FIELDS as readonly string[]).includes(field)) {
			const key = field as SurveyField;
			errors[key] ??= issue.message;
		}
	}
	return errors;
}

// ---------------------------------------------------------------------------------------------
// Database row
// ---------------------------------------------------------------------------------------------

/** A survey_responses row (columns gender and policy_version come from migration 08). */
export type SurveyRow = {
	quiz_session_id: string;
	age_group: AgeBand;
	gender: Gender | null;
	province: Province | null;
	education: Education | typeof NOT_SPECIFIED;
	occupation: Occupation | typeof NOT_SPECIFIED;
	policy_version: string;
	submitted_at: string;
};

export function toSurveyRow(
	demographics: MinimisedDemographics,
	context: { quizSessionId: string; policyVersion: string; submittedAt: string },
): SurveyRow {
	const base = {
		quiz_session_id: context.quizSessionId,
		age_group: demographics.ageBand,
		policy_version: context.policyVersion,
		submitted_at: context.submittedAt,
	};

	if (demographics.minor) {
		return { ...base, gender: null, province: null, education: NOT_SPECIFIED, occupation: NOT_SPECIFIED };
	}

	return {
		...base,
		gender: demographics.gender ?? null,
		province: demographics.province ?? null,
		education: demographics.education ?? NOT_SPECIFIED,
		occupation: demographics.occupation ?? NOT_SPECIFIED,
	};
}
