import type { Metadata } from "next";
import { IconArrowRight } from "@tabler/icons-react";
import { StatusBadge } from "@/components/ds/status-badge";
import { TransitionLink } from "@/components/motion/scan-transition";
import { LEARN_ARTICLES } from "@/lib/content/learn-articles";
import { JsonLd } from "@/lib/seo/json-ld";
import { breadcrumbJsonLd, learnArticlePath, learnHubJsonLd } from "@/lib/seo/structured-data";
import { HelpChannels } from "./_components/help-channels";
import { QuizCta } from "./_components/quiz-cta";

const TITLE = "คลังความรู้: รู้ทันกลโกงมิจฉาชีพที่พบบ่อย";
const DESCRIPTION =
	"รู้ทันกลโกง 6 รูปแบบที่พบบ่อยในไทย ทั้งแก๊งคอลเซ็นเตอร์ SMS ปลอม บัญชี LINE ปลอม หลอกลงทุน หลอกให้รัก และร้านค้าหรืองานออนไลน์ปลอม พร้อมธงแดงที่ควรสังเกตและสิ่งที่ควรทำ";

export const metadata: Metadata = {
	title: TITLE,
	description: DESCRIPTION,
};

export default function LearnHubPage() {
	return (
		<div className="mx-auto flex max-w-[40rem] flex-col gap-10 px-4 pt-8 pb-12 sm:px-6 sm:pt-12">
			<JsonLd
				data={[
					learnHubJsonLd(LEARN_ARTICLES, { name: TITLE, description: DESCRIPTION }),
					breadcrumbJsonLd([
						{ name: "หน้าแรก", path: "/" },
						{ name: "คลังความรู้", path: "/learn" },
					]),
				]}
			/>

			<header className="flex flex-col gap-3">
				<p className="type-label text-brand">คลังความรู้</p>
				<h1 className="type-display-lg text-ink">รู้ทันกลโกงมิจฉาชีพที่พบบ่อย</h1>
				<p className="type-body-lg text-ink-muted">
					มิจฉาชีพเปลี่ยนเรื่องเล่าไปเรื่อย ๆ แต่วิธีการมักซ้ำเดิม อ่านว่าแต่ละกลโกงทำงานอย่างไร
					มีธงแดงอะไรให้สังเกต และควรทำอย่างไรเมื่อเจอ
				</p>
			</header>

			<section aria-labelledby="articles-title" className="flex flex-col gap-4">
				<h2 id="articles-title" className="sr-only">
					บทความทั้งหมด
				</h2>
				<ul className="flex flex-col gap-3">
					{LEARN_ARTICLES.map((article) => (
						<li key={article.slug}>
							<TransitionLink
								href={learnArticlePath(article.slug)}
								className="focus-ring flex flex-col gap-3 rounded-md bg-surface-raised p-5 shadow-raised transition-colors duration-(--dur-quick) ease-settle hover:bg-brand-soft"
							>
								<span className="type-label text-ink-muted">{article.channel}</span>
								<span className="flex flex-col gap-1">
									<span className="type-title text-ink">{article.shortTitle}</span>
									<span className="type-body-sm text-ink-muted">{article.description}</span>
								</span>
								<span className="flex items-center justify-between gap-3">
									<StatusBadge tone="flag">ธงแดง {article.redFlags.length} จุด</StatusBadge>
									<span className="inline-flex items-center gap-1 type-label text-brand">
										อ่านต่อ
										<IconArrowRight aria-hidden stroke={2.25} className="size-4" />
									</span>
								</span>
							</TransitionLink>
						</li>
					))}
				</ul>
			</section>

			<QuizCta />

			<HelpChannels />
		</div>
	);
}
