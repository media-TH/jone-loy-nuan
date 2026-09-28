import type { RiskLevel } from "@/lib/quiz/risk";
import {
	OG_COLORS,
	OG_CONTENT_TYPE,
	OG_SIZE,
	OgCanvas,
	OgFlagPin,
	OgGlyph,
	OgPill,
	renderOgImage,
	type OgGlyphName,
} from "@/lib/seo/og";
import { OG_COPY } from "@/lib/seo/og-text";
import { SHARE_SCORES, SHARE_TOTAL, getShareRiskLevel, parseShareScore } from "@/lib/seo/share";

export const alt = "คะแนนแบบทดสอบสแกนโจร.online ที่ถูกแชร์มา";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export function generateStaticParams() {
	return SHARE_SCORES.map((score) => ({ score: String(score) }));
}

const TONE: Record<RiskLevel, { color: string; glyph: OgGlyphName }> = {
	low: { color: OG_COLORS.safeTone, glyph: "check" },
	medium: { color: OG_COLORS.cautionTone, glyph: "alert" },
	high: { color: OG_COLORS.flagTone, glyph: "flag" },
};

export default async function ShareScoreImage({ params }: { params: Promise<{ score: string }> }) {
	const score = parseShareScore((await params).score);
	if (score === null) return new Response("Not Found", { status: 404 });

	const level = getShareRiskLevel(score);
	const tone = TONE[level];

	return renderOgImage(
		<OgCanvas scanLineTop={392}>
			<div style={{ display: "flex", flex: 1, justifyContent: "space-between" }}>
				<div style={{ display: "flex", flexDirection: "column" }}>
					<div style={{ display: "flex", fontSize: 52, fontWeight: 600, color: OG_COLORS.textSoft }}>
						{OG_COPY.scoreLead}
					</div>
					<div
						style={{
							display: "flex",
							alignItems: "baseline",
							marginTop: -24,
							fontWeight: 700,
							lineHeight: 1.1,
						}}
					>
						<span style={{ fontSize: 260, color: OG_COLORS.spark }}>{score}</span>
						<span style={{ fontSize: 112, color: OG_COLORS.scanLine }}>/{SHARE_TOTAL}</span>
					</div>
					<div style={{ display: "flex", marginTop: 16 }}>
						<OgPill background={tone.color}>
							<OgGlyph name={tone.glyph} size={34} color={OG_COLORS.onSpark} strokeWidth={2.5} />
							<span>{OG_COPY.scoreTone[level]}</span>
						</OgPill>
					</div>
				</div>
				<div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
					<OgFlagPin size={180} />
					<div style={{ display: "flex", marginTop: 20 }}>
						<OgPill background={OG_COLORS.spark}>{OG_COPY.scoreCta}</OgPill>
					</div>
				</div>
			</div>
		</OgCanvas>,
	);
}
