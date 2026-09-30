import Image from "next/image";
import Link from "next/link";
import {
	IconBooks,
	IconClockHour3,
	IconListNumbers,
	IconScan,
	IconUserOff,
} from "@tabler/icons-react";
import { Button } from "@/components/ds/button";
import { ScanReveal } from "@/components/motion/scan-reveal";
import { TransitionLink } from "@/components/motion/scan-transition";
import { PRIVACY_PATH } from "@/lib/privacy/policy";
import { PUBLISHERS } from "@/lib/seo/site";

/**
 * Landing — "Scan & Flag". A static server component: the wordmark, cover and CTA are in the
 * first HTML response, fully visible (no opacity-0 hero), so the cover can be the LCP element.
 * The only motion is one Scan Reveal pass over the cover; client-side navigations get the
 * (main) template's enter animation.
 */

const FACTS = [
	{ id: "scenarios", Icon: IconListNumbers, text: "10 สถานการณ์" },
	{ id: "time", Icon: IconClockHour3, text: "ประมาณ 3 นาที" },
	{ id: "anonymous", Icon: IconUserOff, text: "ไม่ต้องสมัคร ไม่เก็บชื่อ" },
] as const;

type PublisherId = (typeof PUBLISHERS)[number]["id"];

/** Partner marks in the order of the original artwork (TMF left, BoT right); alt text from PUBLISHERS. */
const PARTNER_LOGOS: ReadonlyArray<{ id: PublisherId; src: string; width: number; height: number }> = [
	{ id: "tmf", src: "/Logo_TMF_left.svg", width: 1151, height: 422 },
	{ id: "bot", src: "/Logo_BoT_right.svg", width: 240, height: 128 },
];

function publisherName(id: PublisherId): string {
	return PUBLISHERS.find((publisher) => publisher.id === id)?.name ?? "";
}

export default function HomePage() {
	return (
		<main id="main" className="min-h-screen bg-surface text-ink">
			<div className="mx-auto flex w-full max-w-[30rem] flex-col gap-8 px-4 pt-10 pb-8 sm:px-6 sm:pt-14">
				<header className="flex flex-col items-center gap-2 text-center">
					<h1 className="type-display-xl text-ink">
						สแกนโจร<span className="text-brand">.online</span>
					</h1>
					<p className="type-body-lg text-balance text-ink-muted">
						ดูสถานการณ์จำลอง ตัดสินใจ แล้วดูว่า<span className="whitespace-nowrap">ธงแดง</span>
						ของมิจฉาชีพซ่อนอยู่ตรงไหน
					</p>
				</header>

				{/* Capped by viewport height so "เริ่มสแกน" stays above the fold on short phones. */}
				<ScanReveal className="mx-auto w-full max-w-[min(100%,44svh)] rounded-lg">
					<Image
						src="/cover-01.svg"
						alt="ภาพประกอบ: ชายคนหนึ่งใช้แว่นขยายส่องหน้าจอโทรศัพท์ และพบมิจฉาชีพแอบซ่อนอยู่หลังข้อความ"
						width={1080}
						height={1080}
						preload
						sizes="(min-width: 30rem) 28rem, calc(100vw - 2rem)"
						className="h-auto w-full"
					/>
				</ScanReveal>

				<ul
					role="list"
					aria-label="เกี่ยวกับแบบทดสอบ"
					className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2"
				>
					{FACTS.map(({ id, Icon, text }) => (
						<li key={id} className="inline-flex items-center gap-1.5 type-body-sm font-medium text-ink">
							<Icon aria-hidden stroke={2.25} className="size-5 shrink-0 text-brand" />
							{text}
						</li>
					))}
				</ul>

				<div className="flex flex-col gap-3">
					<Button asChild variant="spark" size="lg" block>
						<TransitionLink href="/quiz">
							<IconScan aria-hidden stroke={2.25} />
							เริ่มสแกน
						</TransitionLink>
					</Button>
					<Button asChild variant="quiet" size="md" block>
						<TransitionLink href="/learn">
							<IconBooks aria-hidden stroke={2.25} />
							เรียนรู้กลโกงยอดฮิต
						</TransitionLink>
					</Button>
				</div>

				<footer className="flex flex-col items-center gap-4 border-t border-line pt-6">
					<p className="type-label text-ink-muted">ร่วมพัฒนาโดย</p>
					<ul
						role="list"
						className="flex w-full items-center justify-center gap-6 rounded-md bg-surface-raised px-6 py-4 shadow-raised"
					>
						{PARTNER_LOGOS.map((logo) => (
							<li key={logo.id} className="flex min-w-0 items-center justify-center">
								<Image
									src={logo.src}
									alt={publisherName(logo.id)}
									width={logo.width}
									height={logo.height}
									className="h-12 w-auto max-w-full object-contain"
								/>
							</li>
						))}
					</ul>
					<Link
						href={PRIVACY_PATH}
						className="focus-ring -mx-1 inline-flex min-h-11 items-center rounded-xs px-1 type-body-sm text-brand underline decoration-2 underline-offset-4 hover:decoration-4"
					>
						ประกาศความเป็นส่วนตัว
					</Link>
				</footer>
			</div>
		</main>
	);
}
