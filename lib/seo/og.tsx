/**
 * Shared drawing kit for the generated social images (next/og, 1200×630, node runtime).
 *
 * next/og's built-in font has no Thai glyphs, so Chakra Petch (OFL, assets/fonts/) is loaded from
 * disk. Satori cannot read CSS variables, so the Design System colours are repeated here as hex;
 * keep them in sync with app/globals.css. Flat fills only: no gradients.
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { CSSProperties, ReactElement, ReactNode } from "react";
import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/seo/site";

export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = "image/png";

/** DS palette for images (illustration primitives + dark-theme status tones, which read on navy). */
export const OG_COLORS = {
	ground: "#1a4175", // navy-800
	ink: "#060a25", // ink-950
	text: "#ffffff",
	textSoft: "#ddeafd", // screen-100
	scanLine: "#accdf8", // screen-300
	scanBand: "rgba(127, 178, 240, 0.22)", // scan-band (dark)
	spark: "#ffc83c", // spark-400
	onSpark: "#0a1330",
	flag: "#ff336d", // flag-500
	flagHighlight: "#ff73b6", // flag-300
	safeTone: "#5cc8f0", // safe (dark)
	cautionTone: "#ffd873", // caution (dark)
	flagTone: "#ff6b93", // flag (dark)
} as const;

const FONT_FAMILY = "Chakra Petch";
const FONT_DIR = join(process.cwd(), "assets", "fonts");

type Fonts = NonNullable<ConstructorParameters<typeof ImageResponse>[1]>["fonts"];

let fontsPromise: Promise<Fonts> | null = null;

/** Chakra Petch SemiBold (600) + Bold (700), read once per server process. */
function loadFonts(): Promise<Fonts> {
	fontsPromise ??= Promise.all([
		readFile(join(FONT_DIR, "ChakraPetch-SemiBold.ttf")),
		readFile(join(FONT_DIR, "ChakraPetch-Bold.ttf")),
	]).then(([semiBold, bold]) => [
		{ name: FONT_FAMILY, data: semiBold, weight: 600, style: "normal" },
		{ name: FONT_FAMILY, data: bold, weight: 700, style: "normal" },
	]);
	return fontsPromise;
}

export async function renderOgImage(element: ReactElement): Promise<ImageResponse> {
	return new ImageResponse(element, { ...OG_SIZE, fonts: await loadFonts() });
}

const OPENING_PUNCTUATION = /^[(\[{“‘]+$/u;
const CLOSING_PUNCTUATION = /^[)\]}”’"'.,:;!?…]+$/u;

/**
 * Satori only wraps lines at spaces, and Thai writes words without them. Split the text into
 * words (ICU's Thai dictionary via Intl.Segmenter) and lay them out as wrapping flex items so a
 * long title breaks between words instead of running off the canvas.
 */
export function OgWrappedText({ text, style }: { text: string; style?: CSSProperties }) {
	const segments =
		typeof Intl.Segmenter === "function"
			? Array.from(new Intl.Segmenter("th", { granularity: "word" }).segment(text), (s) => s.segment)
			: [text];

	// A space becomes trailing margin on the word before it, so a wrapped line never starts with
	// one. Opening brackets and quotes stick to the next word, other punctuation to the previous.
	const words: { text: string; spaced: boolean }[] = [];
	let opening = "";
	for (const segment of segments) {
		const previous = words.at(-1);
		if (segment.trim() === "") {
			if (previous) previous.spaced = true;
		} else if (OPENING_PUNCTUATION.test(segment)) {
			opening += segment;
		} else if (CLOSING_PUNCTUATION.test(segment) && previous && !previous.spaced) {
			previous.text += segment;
		} else {
			words.push({ text: opening + segment, spaced: false });
			opening = "";
		}
	}
	if (opening) words.push({ text: opening, spaced: false });

	return (
		<div style={{ display: "flex", flexWrap: "wrap", ...style }}>
			{words.map((word, index) => (
				<span key={index} style={word.spaced ? { marginRight: "0.3em" } : undefined}>
					{word.text}
				</span>
			))}
		</div>
	);
}

/* ───────────────────────── Glyphs (Tabler Icons, MIT; same paths as StatusIcon) ───────────────────────── */

const GLYPHS = {
	check: ["M5 12l5 5l10 -10"],
	flag: ["M5 5a5 5 0 0 1 7 0a5 5 0 0 0 7 0v9a5 5 0 0 1 -7 0a5 5 0 0 0 -7 0v-9z", "M5 21v-7"],
	alert: [
		"M12 9v4",
		"M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0z",
		"M12 16h.01",
	],
} as const;

export type OgGlyphName = keyof typeof GLYPHS;

export function OgGlyph({
	name,
	size,
	color,
	strokeWidth = 2.25,
}: {
	name: OgGlyphName;
	size: number;
	color: string;
	strokeWidth?: number;
}) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke={color}
			strokeWidth={strokeWidth}
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			{GLYPHS[name].map((d) => (
				<path key={d} d={d} />
			))}
		</svg>
	);
}

/** Four-point spark, the illustrations' attention mark. */
function Spark({ size, style }: { size: number; style: CSSProperties }) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" style={{ position: "absolute", ...style }}>
			<path
				d="M12 0 C13 7 17 11 24 12 C17 13 13 17 12 24 C11 17 7 13 0 12 C7 11 11 7 12 0 Z"
				fill={OG_COLORS.spark}
			/>
		</svg>
	);
}

/**
 * The red-flag pin from the quiz, drawn big: ink-outlined pink disc with a flag, a ledge shadow,
 * the pin's point, and a couple of sparks.
 */
export function OgFlagPin({ size = 220 }: { size?: number }) {
	const disc = size;
	const outline = Math.round(size * 0.035);
	return (
		<div style={{ position: "relative", display: "flex", width: size * 1.35, height: size * 1.45 }}>
			<Spark size={size * 0.22} style={{ top: 0, right: size * 0.02 }} />
			<Spark size={size * 0.13} style={{ top: size * 0.26, right: -size * 0.04 }} />
			<Spark size={size * 0.11} style={{ bottom: size * 0.16, left: 0 }} />
			<div
				style={{
					position: "absolute",
					top: size * 0.14,
					left: size * 0.12,
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
				}}
			>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						width: disc,
						height: disc,
						borderRadius: disc,
						background: OG_COLORS.flag,
						border: `${outline}px solid ${OG_COLORS.ink}`,
						boxShadow: `0 ${outline * 2}px 0 ${OG_COLORS.ink}`,
					}}
				>
					<OgGlyph name="flag" size={disc * 0.52} color={OG_COLORS.text} strokeWidth={2.4} />
				</div>
				<svg
					width={disc * 0.3}
					height={disc * 0.22}
					viewBox="0 0 30 22"
					style={{ marginTop: -outline }}
				>
					<path d="M0 0 L30 0 L15 22 Z" fill={OG_COLORS.ink} />
				</svg>
			</div>
		</div>
	);
}

/** Pill label; `tone` fill + dark ink text (status = word + icon + colour). */
export function OgPill({
	children,
	background,
	color = OG_COLORS.onSpark,
	fontSize = 30,
}: {
	children: ReactNode;
	background: string;
	color?: string;
	fontSize?: number;
}) {
	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				gap: fontSize * 0.4,
				padding: `${fontSize * 0.36}px ${fontSize * 0.8}px`,
				borderRadius: 9999,
				background,
				color,
				fontSize,
				fontWeight: 600,
				lineHeight: 1.3,
				boxShadow: `0 4px 0 ${OG_COLORS.ink}`,
			}}
		>
			{children}
		</div>
	);
}

/**
 * Navy ground, a scan band with its 4px leading scan line, and the site footer. Content sits in
 * a 72px-padded column above the footer.
 */
export function OgCanvas({
	children,
	scanLineTop = 408,
	footerNote = SITE_TAGLINE,
}: {
	children: ReactNode;
	/** y of the scan line; the band trails 72px above it. */
	scanLineTop?: number;
	footerNote?: string;
}) {
	return (
		<div
			style={{
				position: "relative",
				display: "flex",
				flexDirection: "column",
				width: "100%",
				height: "100%",
				background: OG_COLORS.ground,
				color: OG_COLORS.text,
				fontFamily: FONT_FAMILY,
			}}
		>
			<div
				style={{
					position: "absolute",
					left: 0,
					right: 0,
					top: scanLineTop - 72,
					height: 72,
					background: OG_COLORS.scanBand,
				}}
			/>
			<div
				style={{
					position: "absolute",
					left: 0,
					right: 0,
					top: scanLineTop,
					height: 4,
					background: OG_COLORS.scanLine,
				}}
			/>
			<div
				style={{
					position: "relative",
					display: "flex",
					flex: 1,
					padding: "64px 72px 0",
				}}
			>
				{children}
			</div>
			<div
				style={{
					position: "relative",
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					height: 104,
					padding: "0 72px",
					background: OG_COLORS.ink,
				}}
			>
				<div style={{ display: "flex", alignItems: "baseline", fontSize: 40, fontWeight: 700 }}>
					<span>{SITE_NAME.replace(".online", "")}</span>
					<span style={{ color: OG_COLORS.spark }}>.online</span>
				</div>
				<div style={{ display: "flex", fontSize: 26, fontWeight: 600, color: OG_COLORS.scanLine }}>
					{footerNote}
				</div>
			</div>
		</div>
	);
}
