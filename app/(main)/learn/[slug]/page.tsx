import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { IconCheck, IconChevronRight, IconFlag } from "@tabler/icons-react";
import { StatusBadge } from "@/components/ds/status-badge";
import { TransitionLink } from "@/components/motion/scan-transition";
import { LEARN_ARTICLES, getLearnArticle } from "@/lib/content/learn-articles";
import { JsonLd } from "@/lib/seo/json-ld";
import { baseOpenGraph } from "@/lib/seo/metadata";
import {
	articleJsonLd,
	breadcrumbJsonLd,
	faqJsonLd,
	learnArticlePath,
} from "@/lib/seo/structured-data";
import { cn } from "@/lib/utils";
import { HelpChannels } from "../_components/help-channels";
import { QuizCta } from "../_components/quiz-cta";

type Params = { slug: string };
type PageProps = { params: Promise<Params> };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
	return LEARN_ARTICLES.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const article = getLearnArticle((await params).slug);
	if (!article) return {};

	return {
		title: article.shortTitle,
		description: article.description,
		// No `images`: the file-based ./opengraph-image.tsx fills them in.
		openGraph: {
			...baseOpenGraph,
			type: "article",
			publishedTime: article.publishedAt,
			modifiedTime: article.updatedAt,
		},
	};
}

const thaiDate = new Intl.DateTimeFormat("th-TH", {
	day: "numeric",
	month: "long",
	year: "numeric",
	timeZone: "Asia/Bangkok",
});

function Section({
	id,
	title,
	children,
	className,
}: {
	id: string;
	title: string;
	children: ReactNode;
	className?: string;
}) {
	return (
		<section aria-labelledby={id} className={cn("flex flex-col gap-4", className)}>
			<h2 id={id} className="type-title text-ink">
				{title}
			</h2>
			{children}
		</section>
	);
}

function IconList({
	items,
	icon,
	iconClassName,
}: {
	items: readonly string[];
	icon: ReactNode;
	iconClassName: string;
}) {
	return (
		<ul className="flex flex-col gap-3">
			{items.map((item) => (
				<li key={item} className="flex items-start gap-3 type-body text-ink">
					<span aria-hidden className={cn("mt-0.5 inline-flex shrink-0 [&_svg]:size-5", iconClassName)}>
						{icon}
					</span>
					<span>{item}</span>
				</li>
			))}
		</ul>
	);
}

export default async function LearnArticlePage({ params }: PageProps) {
	const article = getLearnArticle((await params).slug);
	if (!article) notFound();

	const path = learnArticlePath(article.slug);
	const related = LEARN_ARTICLES.filter((other) => other.slug !== article.slug);

	return (
		<article className="mx-auto flex max-w-[40rem] flex-col gap-10 px-4 pt-6 pb-12 sm:px-6 sm:pt-10">
			<JsonLd
				data={[
					articleJsonLd(article),
					faqJsonLd(article.faq, path),
					breadcrumbJsonLd([
						{ name: "หน้าแรก", path: "/" },
						{ name: "คลังความรู้", path: "/learn" },
						{ name: article.shortTitle, path },
					]),
				]}
			/>

			<header className="flex flex-col gap-4">
				<nav aria-label="เส้นทางนำทาง">
					<ol className="flex flex-wrap items-center gap-1 type-label text-ink-muted">
						<li className="inline-flex items-center gap-1">
							<TransitionLink
								href="/learn"
								className="focus-ring -mx-1 inline-flex min-h-11 items-center rounded-xs px-1 text-brand underline underline-offset-4"
							>
								คลังความรู้
							</TransitionLink>
							<IconChevronRight aria-hidden stroke={2.25} className="size-4" />
						</li>
						<li aria-current="page" className="inline-flex min-h-11 items-center">
							{article.shortTitle}
						</li>
					</ol>
				</nav>
				<StatusBadge tone="neutral" className="self-start">
					ช่องทาง: {article.channel}
				</StatusBadge>
				<h1 className="type-display-lg text-ink">{article.title}</h1>
				<p className="type-body-lg text-ink">{article.summary}</p>
				<p className="type-body-sm text-ink-muted">
					อัปเดตล่าสุด{" "}
					<time dateTime={article.updatedAt}>{thaiDate.format(new Date(article.updatedAt))}</time>
				</p>
			</header>

			<Section id="how-it-works" title="กลโกงนี้ทำงานอย่างไร">
				<ol className="flex flex-col gap-5">
					{article.steps.map((step, index) => (
						<li key={step.title} className="flex items-start gap-4">
							<span
								aria-hidden
								className="grid size-9 shrink-0 place-items-center rounded-xs bg-brand-soft font-display text-base font-bold text-ink tabular-nums"
							>
								{index + 1}
							</span>
							<div className="flex flex-col gap-1">
								<h3 className="font-display text-lg font-semibold text-ink">{step.title}</h3>
								<p className="type-body text-ink-muted">{step.detail}</p>
							</div>
						</li>
					))}
				</ol>
			</Section>

			<Section
				id="red-flags"
				title="ธงแดงที่ควรสังเกต"
				className="rounded-lg bg-surface-raised p-5 shadow-raised sm:p-6"
			>
				<StatusBadge tone="flag" className="self-start">
					ถ้าเจอข้อใดข้อหนึ่ง ให้หยุดก่อน
				</StatusBadge>
				<IconList
					items={article.redFlags}
					icon={<IconFlag stroke={2.25} />}
					iconClassName="text-flag-text"
				/>
			</Section>

			<Section id="what-to-do" title="ควรทำอย่างไร">
				<div className="flex flex-col gap-3">
					<h3 className="font-display text-lg font-semibold text-ink">ป้องกันไว้ก่อน</h3>
					<IconList
						items={article.prevention}
						icon={<IconCheck stroke={2.5} />}
						iconClassName="text-safe"
					/>
				</div>
				<div className="flex flex-col gap-3 rounded-md bg-caution-soft p-5">
					<h3 className="font-display text-lg font-semibold text-ink">ถ้าพลาดไปแล้ว</h3>
					<ol className="flex list-decimal flex-col gap-2 ps-5 type-body text-ink marker:font-display marker:font-bold marker:text-caution-text">
						{article.ifAffected.map((item) => (
							<li key={item} className="ps-1">
								{item}
							</li>
						))}
					</ol>
				</div>
			</Section>

			<HelpChannels />

			<Section id="faq" title="คำถามที่พบบ่อย">
				<dl className="flex flex-col gap-5">
					{article.faq.map((item) => (
						<div key={item.question} className="flex flex-col gap-1 border-t border-line pt-5 first:border-t-0 first:pt-0">
							<dt className="font-display text-lg font-semibold text-ink">{item.question}</dt>
							<dd className="type-body text-ink-muted">{item.answer}</dd>
						</div>
					))}
				</dl>
			</Section>

			<QuizCta />

			<nav aria-labelledby="related-title" className="flex flex-col gap-3">
				<h2 id="related-title" className="type-title text-ink">
					อ่านกลโกงรูปแบบอื่น
				</h2>
				<ul className="flex flex-col">
					{related.map((other) => (
						<li key={other.slug} className="border-t border-line first:border-t-0">
							<TransitionLink
								href={learnArticlePath(other.slug)}
								className="focus-ring flex min-h-12 items-center justify-between gap-3 rounded-xs py-2 type-body text-brand underline-offset-4 hover:underline"
							>
								{other.shortTitle}
								<IconChevronRight aria-hidden stroke={2.25} className="size-5 shrink-0" />
							</TransitionLink>
						</li>
					))}
				</ul>
			</nav>
		</article>
	);
}
