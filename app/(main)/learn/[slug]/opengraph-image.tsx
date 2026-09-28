import { LEARN_ARTICLES, getLearnArticle } from "@/lib/content/learn-articles";
import {
	OG_COLORS,
	OG_CONTENT_TYPE,
	OG_SIZE,
	OgCanvas,
	OgFlagPin,
	OgGlyph,
	OgWrappedText,
	renderOgImage,
} from "@/lib/seo/og";
import { OG_COPY } from "@/lib/seo/og-text";

export const alt = "บทความคลังความรู้ สแกนโจร.online";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export function generateStaticParams() {
	return LEARN_ARTICLES.map((article) => ({ slug: article.slug }));
}

export default async function LearnArticleImage({ params }: { params: Promise<{ slug: string }> }) {
	const article = getLearnArticle((await params).slug);
	if (!article) return new Response("Not Found", { status: 404 });

	return renderOgImage(
		<OgCanvas scanLineTop={432} footerNote={OG_COPY.learnFooter}>
			<div style={{ display: "flex", flex: 1, justifyContent: "space-between", gap: 40 }}>
				<div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: 16,
							fontSize: 30,
							fontWeight: 600,
							color: OG_COLORS.scanLine,
						}}
					>
						<span>{OG_COPY.learnEyebrow}</span>
						<span style={{ width: 8, height: 8, borderRadius: 8, background: OG_COLORS.scanLine }} />
						<span>{article.channel}</span>
					</div>
					<OgWrappedText
						text={article.shortTitle}
						style={{ marginTop: 20, fontSize: 80, fontWeight: 700, lineHeight: 1.3 }}
					/>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: 14,
							marginTop: "auto",
							marginBottom: 36,
							fontSize: 36,
							fontWeight: 600,
							color: OG_COLORS.textSoft,
						}}
					>
						<OgGlyph name="flag" size={40} color={OG_COLORS.flagTone} strokeWidth={2.5} />
						<span>{OG_COPY.learnFlags(article.redFlags.length)}</span>
					</div>
				</div>
				<div style={{ display: "flex", alignItems: "flex-start" }}>
					<OgFlagPin size={170} />
				</div>
			</div>
		</OgCanvas>,
	);
}
