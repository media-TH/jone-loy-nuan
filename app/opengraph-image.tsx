import { OG_COLORS, OG_CONTENT_TYPE, OG_SIZE, OgCanvas, OgFlagPin, OgPill, renderOgImage } from "@/lib/seo/og";
import { OG_COPY } from "@/lib/seo/og-text";
import { PUBLISHERS, SITE_TAGLINE } from "@/lib/seo/site";

export const alt = `สแกนโจร.online ${SITE_TAGLINE} โดย${PUBLISHERS.map((org) => org.name).join(" และ")}`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/** Site-wide social image; also the twitter:image (Next copies og:image when none is set). */
export default async function OpenGraphImage() {
	return renderOgImage(
		<OgCanvas footerNote={PUBLISHERS.map((org) => org.alternateName).join(" × ")}>
			<div style={{ display: "flex", flex: 1, justifyContent: "space-between" }}>
				<div style={{ display: "flex", flexDirection: "column" }}>
					<div
						style={{
							display: "flex",
							fontSize: 30,
							fontWeight: 600,
							letterSpacing: 1,
							color: OG_COLORS.scanLine,
						}}
					>
						{OG_COPY.rootEyebrow}
					</div>
					<div
						style={{
							display: "flex",
							alignItems: "baseline",
							marginTop: 12,
							fontSize: 156,
							fontWeight: 700,
							lineHeight: 1.25,
						}}
					>
						<span>สแกนโจร</span>
						<span style={{ fontSize: 72, color: OG_COLORS.spark }}>.online</span>
					</div>
					<div
						style={{
							display: "flex",
							fontSize: 46,
							fontWeight: 600,
							lineHeight: 1.4,
							color: OG_COLORS.textSoft,
						}}
					>
						{SITE_TAGLINE}
					</div>
					<div style={{ display: "flex", marginTop: 44 }}>
						<OgPill background={OG_COLORS.spark}>{OG_COPY.rootCta}</OgPill>
					</div>
				</div>
				<div style={{ display: "flex", alignItems: "flex-start", marginTop: 8 }}>
					<OgFlagPin size={200} />
				</div>
			</div>
		</OgCanvas>,
	);
}
