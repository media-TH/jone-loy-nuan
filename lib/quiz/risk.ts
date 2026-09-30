/**
 * Risk assessment for a finished quiz.
 *
 * Thresholds are defined on a 0–10 scale (the score is normalised and rounded first) and are
 * unchanged from the original result page:
 *   0–3 → high · 4–8 → medium · 9–10 → low
 * A quiz with no questions counts as 0/10, i.e. high risk.
 */

export const RISK_LEVELS = ["low", "medium", "high"] as const;

export type RiskLevel = (typeof RISK_LEVELS)[number];

/** Status tone used to present a level (StatusBadge, RiskMeter arc). */
export type RiskTone = "safe" | "caution" | "flag";

export const RISK_THRESHOLDS = {
	/** Scores (out of 10) at or below this are high risk. */
	highMax: 3,
	/** Scores (out of 10) at or above this are low risk. */
	lowMin: 9,
} as const;

export type RiskCopy = {
	/** Short status word shown next to an icon, e.g. in the risk meter badge. */
	label: string;
	tone: RiskTone;
	/** Result headline, second person. */
	title: string;
	description: string;
	/** Illustration in public/, e.g. /images/results/risk-low.svg */
	illustration: `/images/results/risk-${RiskLevel}.svg`;
	illustrationAlt: string;
	tips: readonly string[];
};

/**
 * Score normalised to 0–10 and rounded half up, the unit the thresholds use.
 * Out-of-range or non-finite input is clamped rather than trusted.
 */
export function toScoreOutOfTen(score: number, total: number): number {
	if (!Number.isFinite(score) || !Number.isFinite(total) || total <= 0) return 0;
	const clamped = Math.min(Math.max(score, 0), total);
	return Math.round((clamped * 10) / total);
}

export function getRiskLevel(score: number, total: number): RiskLevel {
	const outOfTen = toScoreOutOfTen(score, total);
	if (outOfTen <= RISK_THRESHOLDS.highMax) return "high";
	if (outOfTen < RISK_THRESHOLDS.lowMin) return "medium";
	return "low";
}

export const RISK_COPY: Readonly<Record<RiskLevel, RiskCopy>> = {
	low: {
		label: "ความเสี่ยงต่ำ",
		tone: "safe",
		title: "คุณรู้เท่าทันมิจฉาชีพ",
		description:
			"คุณมองเห็นธงแดงได้เกือบครบทุกจุด ช่วยส่งต่อวิธีสังเกตเหล่านี้ให้คนรอบข้าง เพื่อให้ทุกคนรู้ทันกลโกงไปด้วยกัน",
		illustration: "/images/results/risk-low.svg",
		illustrationAlt: "ภาพประกอบผลลัพธ์ ความเสี่ยงต่ำ",
		tips: [
			"แยกแยะข้อเสนอหลอกลวงและรู้ทันกลโกงได้",
			"มีทักษะด้านความปลอดภัยไซเบอร์",
			"ย้ำเตือนคนรอบข้าง ไม่ให้แชร์หรือโอนเงิน",
			"หากพบคนถูกหลอก ส่งต่อข้อมูลให้โทร 1441",
		],
	},
	medium: {
		label: "ความเสี่ยงปานกลาง",
		tone: "caution",
		title: "คุณพอจับพิรุธมิจฉาชีพได้",
		description:
			"คุณจับพิรุธได้หลายจุด แต่ยังมีบางกลโกงที่แนบเนียนพอจะหลอกได้ ลองกลับไปดูธงแดงในข้อที่พลาดอีกครั้ง",
		illustration: "/images/results/risk-medium.svg",
		illustrationAlt: "ภาพประกอบผลลัพธ์ ความเสี่ยงปานกลาง",
		tips: [
			"อย่าเชื่อข้อเสนอที่ดีเกินจริง แม้ดูน่าเชื่อถือ",
			"ตรวจสอบชื่อบัญชี เบอร์โทร และเว็บไซต์ทุกครั้ง",
			"ไม่โอนเงินให้ และหยุดทันทีหากถูกจูงใจเพิ่ม",
			"หากสงสัยว่าจะถูกโกง ติดต่อสายด่วน 1441",
		],
	},
	high: {
		label: "ความเสี่ยงสูง",
		tone: "flag",
		title: "คุณเสี่ยงตกเป็นเหยื่อมิจฉาชีพ",
		description:
			"กลโกงเหล่านี้ถูกออกแบบมาให้แนบเนียน พลาดได้ไม่แปลก ลองดูธงแดงของแต่ละข้ออีกครั้ง แล้วคุณจะจับพิรุธได้ง่ายขึ้น",
		illustration: "/images/results/risk-high.svg",
		illustrationAlt: "ภาพประกอบผลลัพธ์ ความเสี่ยงสูง",
		tips: [
			"อย่าหลงเชื่อเมื่อมีคนเสนอเงินหรือขู่บังคับ",
			"ปรึกษาคนรอบข้าง และค้นหาข้อมูลก่อน",
			"ห้ามโอนเงิน หากเผลอโอนแล้วอย่าโอนเพิ่ม",
			"ถ้าถูกหลอก ติดต่อสายด่วน 1441 เท่านั้น",
		],
	},
};

export type RiskAssessment = RiskCopy & {
	level: RiskLevel;
	scoreOutOfTen: number;
};

/** Level + copy for a finished quiz, ready for the result page. */
export function getRiskAssessment(score: number, total: number): RiskAssessment {
	const level = getRiskLevel(score, total);
	return { ...RISK_COPY[level], level, scoreOutOfTen: toScoreOutOfTen(score, total) };
}
