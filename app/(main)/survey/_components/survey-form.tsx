"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { flushSync } from "react-dom";
import { IconInfoCircle, IconScan, IconShieldLock } from "@tabler/icons-react";
import { Button } from "@/components/ds/button";
import { ChoiceChips } from "@/components/ds/choice-chips";
import { ConsentPanel } from "@/components/ds/consent-panel";
import { Field, FieldSelect } from "@/components/ds/field";
import { StatusBadge } from "@/components/ds/status-badge";
import { TransitionLink, useTransitionRouter } from "@/components/motion/scan-transition";
import { recordConsent } from "@/lib/actions/privacy";
import { submitSurveyAction } from "@/lib/actions/survey";
import {
	CONSENT_FIELD_PREFIX,
	POLICY_VERSION,
	PRIVACY_PATH,
	PURPOSES,
	consentFieldName,
} from "@/lib/privacy/policy";
import {
	AGE_BAND_OPTIONS,
	EDUCATION_OPTIONS,
	GENDER_OPTIONS,
	OCCUPATION_OPTIONS,
	PROVINCE_OPTIONS,
	isMinorAgeBand,
	type AgeBand,
	type Gender,
	type SurveyField,
	type SurveyFieldErrors,
} from "@/lib/privacy/survey";
import type { SurveyResultCode } from "@/lib/privacy/types";
import { getCachedAnonToken } from "@/lib/services/anon-jwt.service";
import { useQuizResultStore } from "@/store/quiz-store";

/**
 * Optional demographic survey between the quiz and the result (PDPA: lib/privacy/policy.ts).
 *
 * - Nothing leaves the browser without the demographics consent switch: with it off, "ดูผลลัพธ์"
 *   goes straight to the result, and "ข้ามแบบสอบถาม" always does. The result never depends on it.
 * - With consent on: the age band is required, the consent is recorded (recordConsent) and only
 *   then are the answers sent (submitSurveyAction), both under this tab's anon token.
 * - Under 20 (s.20): only the age band is asked for and sent; the other questions are hidden and
 *   their answers cleared.
 */

type ConsentState = Record<string, boolean>;

type Notice = {
	tone: "flag" | "caution";
	word: string;
	message: string;
};

const FIELD_IDS: Record<SurveyField, string> = {
	ageBand: "survey-age-band",
	gender: "survey-gender",
	province: "survey-province",
	education: "survey-education",
	occupation: "survey-occupation",
};

const FIELD_ORDER: readonly SurveyField[] = ["ageBand", "gender", "province", "education", "occupation"];

const NO_SESSION_NOTICE: Notice = {
	tone: "caution",
	word: "ยังไม่ได้บันทึก",
	message:
		"ไม่พบรอบแบบทดสอบของคุณในแท็บนี้ จึงยังบันทึกคำตอบไม่ได้ คุณกด “ข้ามแบบสอบถาม” เพื่อดูผลลัพธ์ต่อได้ตามปกติ",
};

const NETWORK_NOTICE: Notice = {
	tone: "flag",
	word: "ส่งไม่สำเร็จ",
	message: "เชื่อมต่อระบบไม่ได้ชั่วคราว ลองส่งอีกครั้ง หรือกด “ข้ามแบบสอบถาม” เพื่อดูผลลัพธ์ต่อ",
};

/** Result codes → a status word and tone; the Thai message itself comes from the server. */
function noticeFor(code: SurveyResultCode | "invalid_identity" | undefined, message: string): Notice {
	switch (code) {
		case "no_session":
		case "invalid_identity":
			return { ...NO_SESSION_NOTICE, message: message || NO_SESSION_NOTICE.message };
		case "invalid_input":
			return { tone: "flag", word: "ตรวจสอบอีกครั้ง", message };
		case "rate_limited":
			return { tone: "caution", word: "รอสักครู่", message };
		case "policy_outdated":
			return { tone: "caution", word: "ประกาศมีการปรับปรุง", message };
		default:
			return { tone: "flag", word: "บันทึกไม่สำเร็จ", message: message || NETWORK_NOTICE.message };
	}
}

function isAgeBand(value: string): value is AgeBand {
	return AGE_BAND_OPTIONS.some((option) => option.value === value);
}

function isGender(value: string): value is Gender {
	return GENDER_OPTIONS.some((option) => option.value === value);
}

/** Moves focus to a field's control: the chosen (or first) chip of a group, or the select. */
function focusField(field: SurveyField) {
	const element = document.getElementById(FIELD_IDS[field]);
	if (!element) return;
	const target =
		element.getAttribute("role") === "radiogroup"
			? (element.querySelector<HTMLElement>('[role="radio"][data-state="checked"]') ??
				element.querySelector<HTMLElement>('[role="radio"]'))
			: element;
	target?.focus();
}

function firstInvalidField(errors: SurveyFieldErrors): SurveyField | undefined {
	return FIELD_ORDER.find((field) => errors[field]);
}

export function SurveyForm() {
	const router = useTransitionRouter();
	const [isPending, startTransition] = useTransition();
	const submittingRef = useRef(false);

	const [ageBand, setAgeBand] = useState<AgeBand | null>(null);
	const [gender, setGender] = useState<Gender | null>(null);
	const [province, setProvince] = useState("");
	const [education, setEducation] = useState("");
	const [occupation, setOccupation] = useState("");
	const [consent, setConsent] = useState<ConsentState>({});
	const [fieldErrors, setFieldErrors] = useState<SurveyFieldErrors>({});
	const [notice, setNotice] = useState<Notice | null>(null);

	const consentGiven = consent.demographics === true;
	const minor = ageBand !== null && isMinorAgeBand(ageBand);
	const answeredSomething = Boolean(ageBand || gender || province || education || occupation);
	const busy = isPending || router.isTransitioning;

	const clearError = (field: SurveyField) =>
		setFieldErrors((errors) => (errors[field] ? { ...errors, [field]: undefined } : errors));

	const handleAgeBand = (value: string) => {
		if (!isAgeBand(value)) return;
		setAgeBand(value);
		clearError("ageBand");
		// s.20: nothing more is asked of anyone under 20, and nothing at all is sent or kept.
		if (isMinorAgeBand(value)) {
			setGender(null);
			setProvince("");
			setEducation("");
			setOccupation("");
		}
	};

	const handleConsent = (id: string, granted: boolean) => {
		setConsent((current) => ({ ...current, [id]: granted }));
		if (!granted) {
			// Without consent nothing is required any more.
			setFieldErrors({});
			setNotice(null);
		}
	};

	/** Shows the errors, then focuses the first invalid control once its message is in the DOM. */
	const showFieldErrors = (errors: SurveyFieldErrors, nextNotice: Notice | null) => {
		flushSync(() => {
			setFieldErrors(errors);
			setNotice(nextNotice);
		});
		const first = firstInvalidField(errors);
		if (first) focusField(first);
	};

	const submitWithConsent = async (answers: FormData) => {
		const token = getCachedAnonToken()?.token;
		const quizSessionId = useQuizResultStore.getState().databaseSessionId;
		if (!token || !quizSessionId) {
			setNotice(NO_SESSION_NOTICE);
			return;
		}

		// s.19: the consent is on record before any answer is sent.
		const consentResult = await recordConsent({
			token,
			purpose: "demographics",
			granted: true,
			policyVersion: POLICY_VERSION,
		});
		if (!consentResult.ok) {
			setNotice(noticeFor(consentResult.code, consentResult.message));
			return;
		}

		answers.set("token", token);
		answers.set("quizSessionId", quizSessionId);
		answers.set("policyVersion", POLICY_VERSION);
		const result = await submitSurveyAction(null, answers);

		if (result.success) {
			router.push("/result");
			return;
		}
		const errors = result.fieldErrors ?? {};
		const nextNotice = noticeFor(result.code, result.message);
		if (firstInvalidField(errors)) showFieldErrors(errors, nextNotice);
		else setNotice(nextNotice);
	};

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (busy || submittingRef.current) return;

		// No consent, or under 20 (s.20: we keep nothing for minors): nothing is sent at all, not
		// even to be discarded by the server, and no consent is logged.
		if (!consentGiven || minor) {
			router.push("/result");
			return;
		}

		if (!ageBand) {
			showFieldErrors(
				{ ageBand: "กรุณาเลือกช่วงอายุ หรือปิด “ยินยอม” หากไม่ต้องการให้ข้อมูล" },
				null,
			);
			return;
		}

		// Built from state, not the DOM, so hidden questions can never be sent.
		const answers = new FormData();
		answers.set(consentFieldName("demographics"), "granted");
		answers.set("ageBand", ageBand);
		if (gender) answers.set("gender", gender);
		if (province) answers.set("province", province);
		if (education) answers.set("education", education);
		if (occupation) answers.set("occupation", occupation);

		submittingRef.current = true;
		setNotice(null);
		startTransition(async () => {
			try {
				await submitWithConsent(answers);
			} catch (error) {
				console.error("[survey] submit failed", error);
				setNotice(NETWORK_NOTICE);
			} finally {
				submittingRef.current = false;
			}
		});
	};

	return (
		<form noValidate onSubmit={handleSubmit} aria-busy={busy} className="flex flex-col gap-8">
			<fieldset className="m-0 flex min-w-0 flex-col gap-6 border-0 p-0">
				<legend className="sr-only">ข้อมูลเกี่ยวกับคุณ</legend>

				<Field
					id={FIELD_IDS.ageBand}
					label="ช่วงอายุ"
					helper={consentGiven ? undefined : "จำเป็นเมื่อคุณเปิด “ยินยอม” ด้านล่าง"}
					required={consentGiven}
					error={fieldErrors.ageBand}
					controlType="group"
				>
					{(control, ids) => (
						<ChoiceChips
							{...control}
							aria-labelledby={ids.labelId}
							name="ageBand"
							options={AGE_BAND_OPTIONS}
							value={ageBand}
							onValueChange={handleAgeBand}
							columns={2}
						/>
					)}
				</Field>

				{minor ? (
					<div className="flex items-start gap-3 rounded-md bg-surface-sunken p-4 text-ink">
						<IconShieldLock aria-hidden stroke={2.25} className="mt-0.5 size-5 shrink-0 text-brand" />
						<p className="type-body-sm">
							<span className="font-semibold">สำหรับผู้ที่อายุต่ำกว่า 20 ปี เราไม่เก็บข้อมูลจากแบบสอบถามนี้</span>{" "}
							ไม่ว่าจะเปิด “ยินยอม” หรือไม่ ช่วงอายุที่เลือกจะไม่ถูกส่งหรือบันทึก กด “ดูผลลัพธ์” ได้เลย
						</p>
					</div>
				) : (
					<>
						<Field
							id={FIELD_IDS.gender}
							label="เพศ"
							helper="ไม่บังคับ"
							error={fieldErrors.gender}
							controlType="group"
						>
							{(control, ids) => (
								<ChoiceChips
									{...control}
									aria-labelledby={ids.labelId}
									name="gender"
									options={GENDER_OPTIONS}
									value={gender}
									onValueChange={(value) => {
										if (!isGender(value)) return;
										setGender(value);
										clearError("gender");
									}}
									columns={2}
								/>
							)}
						</Field>

						<Field id={FIELD_IDS.province} label="จังหวัดที่อยู่" helper="ไม่บังคับ" error={fieldErrors.province}>
							<FieldSelect
								name="province"
								placeholder="เลือกจังหวัด"
								value={province}
								onChange={(event) => {
									setProvince(event.currentTarget.value);
									clearError("province");
								}}
							>
								{PROVINCE_OPTIONS.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</FieldSelect>
						</Field>

						<Field id={FIELD_IDS.education} label="ระดับการศึกษา" helper="ไม่บังคับ" error={fieldErrors.education}>
							<FieldSelect
								name="education"
								placeholder="เลือกระดับการศึกษา"
								value={education}
								onChange={(event) => {
									setEducation(event.currentTarget.value);
									clearError("education");
								}}
							>
								{EDUCATION_OPTIONS.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</FieldSelect>
						</Field>

						<Field id={FIELD_IDS.occupation} label="อาชีพ" helper="ไม่บังคับ" error={fieldErrors.occupation}>
							<FieldSelect
								name="occupation"
								placeholder="เลือกอาชีพ"
								value={occupation}
								onChange={(event) => {
									setOccupation(event.currentTarget.value);
									clearError("occupation");
								}}
							>
								{OCCUPATION_OPTIONS.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</FieldSelect>
						</Field>
					</>
				)}
			</fieldset>

			<ConsentPanel
				purposes={PURPOSES}
				value={consent}
				onChange={handleConsent}
				policyHref={PRIVACY_PATH}
				policyVersion={POLICY_VERSION}
				namePrefix={CONSENT_FIELD_PREFIX}
				disabled={busy}
			/>

			<div className="flex flex-col gap-3">
				{answeredSomething && !consentGiven && !minor ? (
					<p className="flex items-start gap-2 type-body-sm text-ink-muted">
						<IconInfoCircle aria-hidden stroke={2.25} className="mt-0.5 size-[1.125rem] shrink-0" />
						<span>คุณยังไม่ได้เปิด “ยินยอม” คำตอบข้างบนจะไม่ถูกส่งหรือบันทึก และเราจะพาไปดูผลลัพธ์เลย</span>
					</p>
				) : null}

				<div role="status" aria-live="polite">
					{notice ? (
						<div className="flex flex-col items-start gap-2 rounded-md bg-surface-raised p-4 shadow-raised">
							<StatusBadge tone={notice.tone}>{notice.word}</StatusBadge>
							<p className="type-body-sm text-ink">{notice.message}</p>
						</div>
					) : null}
				</div>

				<Button type="submit" variant="spark" size="lg" block disabled={busy}>
					<IconScan aria-hidden stroke={2.25} />
					{isPending ? "กำลังบันทึก…" : "ดูผลลัพธ์"}
				</Button>
				<Button asChild variant="quiet" size="md" block>
					<TransitionLink href="/result">ข้ามแบบสอบถาม</TransitionLink>
				</Button>
			</div>
		</form>
	);
}
