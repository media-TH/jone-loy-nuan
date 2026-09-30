/**
 * Thai text limits of next/og (Satori).
 *
 * Satori places every glyph at its default position and applies no OpenType mark positioning.
 * Chakra Petch (like most modern Thai fonts) relies on that positioning, so in generated images:
 *   - a tone mark after an upper vowel (ที่, เสี่ยง) or before SARA AM (ต่ำ) is drawn on top of it,
 *   - marks above ป ฝ ฟ ฬ run into the consonant's ascender (ปัก, ฟ้า),
 *   - lower vowels under ญ ฐ ฎ ฏ run into the descender (ญุ).
 * Browsers render these correctly; only image copy has to avoid them. Every string drawn into an
 * image is checked by __tests__/seo/og-text.test.ts.
 */

const UPPER_VOWEL_THEN_MARK = /[ัิ-ื็ํ][่-์]/u;
const MARK_THEN_SARA_AM = /[่-๋]ำ/u;
const TALL_CONSONANT_UPPER_MARK = /[ปฝฟฬ][ุ-ฺ]?[ัำ-ื็-๎]/u;
const DESCENDER_LOWER_VOWEL = /[ญฎฏฐ][ุ-ฺ]/u;

const RULES: ReadonlyArray<{ pattern: RegExp; reason: string }> = [
	{ pattern: UPPER_VOWEL_THEN_MARK, reason: "tone mark stacked on an upper vowel" },
	{ pattern: MARK_THEN_SARA_AM, reason: "tone mark before SARA AM" },
	{ pattern: TALL_CONSONANT_UPPER_MARK, reason: "mark above a tall consonant (ป ฝ ฟ ฬ)" },
	{ pattern: DESCENDER_LOWER_VOWEL, reason: "lower vowel under a descender (ญ ฐ ฎ ฏ)" },
];

/**
 * Copy drawn into the generated images, kept here so the test can check all of it. Some wording
 * differs from the page copy on purpose (e.g. no "ความเสี่ยง", whose เสี่ยง stacks two marks).
 */
export const OG_COPY = {
	rootEyebrow: "สแกนหาธงแดง · รู้ทันกลโกง",
	rootCta: "ลองสแกน 10 สถานการณ์จำลอง",
	scoreLead: "มีคนสแกนได้",
	scoreCta: "ถึงตาคุณลองสแกนบ้าง",
	/** Status word per risk level (paired with an icon and the tone colour in the image). */
	scoreTone: {
		low: "รู้ทันกลโกง",
		medium: "พอจับพิรุธได้",
		high: "ยังพลาดธงแดงหลายจุด",
	},
	learnEyebrow: "คลังความรู้",
	learnFlags: (count: number) => `รู้ทัน ${count} ธงแดงก่อนโดนหลอก`,
	learnFooter: "รู้ทันกลโกงมิจฉาชีพ",
} as const;

/** Problems Satori would draw wrongly in `text`; empty when the text is safe for an OG image. */
export function findOgThaiIssues(text: string): string[] {
	return RULES.flatMap(({ pattern, reason }) => {
		const match = text.match(pattern);
		return match ? [`${reason}: "${match[0]}" in "${text}"`] : [];
	});
}
