import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IconBooks, IconScan } from "@tabler/icons-react";
import { Button } from "@/components/ds/button";
import { StatusBadge } from "@/components/ds/status-badge";
import { TransitionLink } from "@/components/motion/scan-transition";
import { PrivacyNote } from "@/components/privacy/privacy-note";
import { RISK_COPY } from "@/lib/quiz/risk";
import { shareLandingRobots } from "@/lib/seo/metadata";
import { SHARE_SCORES, SHARE_TOTAL, getShareRiskLevel, parseShareScore } from "@/lib/seo/share";

type Params = { score: string };
type PageProps = { params: Promise<Params> };

/** Only /s/0 … /s/10 exist; anything else is a 404. */
export const dynamicParams = false;

export function generateStaticParams(): Params[] {
	return SHARE_SCORES.map((score) => ({ score: String(score) }));
}

const DESCRIPTION =
	"ลองทำแบบทดสอบ 10 สถานการณ์จำลองกลโกงมิจฉาชีพที่ใกล้เคียงชีวิตจริง แล้วดูว่าคุณจับธงแดงได้กี่จุด";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const score = parseShareScore((await params).score);
	if (score === null) return {};

	return {
		title: `มีคนสแกนได้ ${score}/${SHARE_TOTAL}`,
		description: DESCRIPTION,
		// Exists for link previews (./opengraph-image.tsx); kept out of search results.
		robots: shareLandingRobots,
	};
}

export default async function ShareScorePage({ params }: PageProps) {
	const score = parseShareScore((await params).score);
	if (score === null) notFound();

	const risk = RISK_COPY[getShareRiskLevel(score)];

	return (
		<main className="flex min-h-screen flex-col bg-surface text-ink">
			<header className="mx-auto flex w-full max-w-[30rem] px-4 sm:px-6">
				<TransitionLink
					href="/"
					className="focus-ring -mx-2 inline-flex min-h-14 items-center rounded-xs px-2 font-display text-lg font-bold text-ink"
				>
					สแกนโจร<span className="text-brand">.online</span>
				</TransitionLink>
			</header>

			<div className="mx-auto flex w-full max-w-[30rem] flex-1 flex-col justify-center gap-8 px-4 pt-4 pb-12 sm:px-6">
				<section
					aria-labelledby="share-title"
					className="flex flex-col items-center gap-4 rounded-lg bg-surface-raised px-6 py-8 text-center shadow-raised"
				>
					<p className="type-label text-ink-muted">ผลการสแกนที่ถูกแชร์มา</p>
					<h1 id="share-title" className="flex flex-col items-center gap-2">
						<span className="type-title text-ink">มีคนสแกนได้</span>
						<span className="type-numeral inline-flex items-baseline text-ink">
							{score}
							<span aria-hidden className="text-ink-muted">
								/{SHARE_TOTAL}
							</span>
							<span className="sr-only"> จาก {SHARE_TOTAL} ข้อ</span>
						</span>
					</h1>
					<StatusBadge tone={risk.tone}>{risk.label}</StatusBadge>
					<p className="type-body text-ink-muted">
						สแกนโจร.online คือแบบทดสอบ {SHARE_TOTAL} สถานการณ์จำลอง ทั้งสายโทรเข้า SMS แชต
						และโฆษณาออนไลน์ ลองดูว่าคุณจะจับธงแดงของมิจฉาชีพได้กี่จุด
					</p>
				</section>

				<div className="flex flex-col gap-3">
					<Button asChild variant="spark" size="lg" block>
						<TransitionLink href="/quiz">
							<IconScan aria-hidden stroke={2.25} />
							ลองสแกนดูบ้าง
						</TransitionLink>
					</Button>
					<Button asChild variant="quiet" size="md" block>
						<TransitionLink href="/learn">
							<IconBooks aria-hidden stroke={2.25} />
							อ่านวิธีสังเกตกลโกง
						</TransitionLink>
					</Button>
					<PrivacyNote />
				</div>
			</div>
		</main>
	);
}
