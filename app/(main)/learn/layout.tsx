import type { ReactNode } from "react";
import Link from "next/link";
import { TransitionLink } from "@/components/motion/scan-transition";
import { PUBLISHERS } from "@/lib/seo/site";

/** Chrome for the learn hub: wordmark bar, prose column, publisher footer. Static RSC. */
export default function LearnLayout({ children }: { children: ReactNode }) {
	return (
		<div className="flex min-h-screen flex-col bg-surface text-ink">
			<header className="border-b border-line bg-surface-raised">
				<div className="mx-auto flex max-w-[40rem] items-center justify-between gap-4 px-4 sm:px-6">
					<TransitionLink
						href="/"
						className="focus-ring -mx-2 inline-flex min-h-12 items-center rounded-xs px-2 font-display text-lg font-bold text-ink"
					>
						สแกนโจร<span className="text-brand">.online</span>
					</TransitionLink>
					<TransitionLink
						href="/learn"
						className="focus-ring -mx-2 inline-flex min-h-11 items-center rounded-xs px-2 type-label text-brand underline-offset-4 hover:underline"
					>
						คลังความรู้
					</TransitionLink>
				</div>
			</header>

			<main id="main" className="flex-1">
				{children}
			</main>

			<footer className="border-t border-line">
				<div className="mx-auto flex max-w-[40rem] flex-col gap-2 px-4 py-8 sm:px-6">
					<p className="type-body-sm text-ink-muted">
						จัดทำโดย {PUBLISHERS.map((org) => org.name).join(" และ")}
					</p>
					<Link
						href="/privacy"
						className="focus-ring -mx-1 inline-flex min-h-11 items-center self-start rounded-xs px-1 type-body-sm text-brand underline underline-offset-4"
					>
						นโยบายความเป็นส่วนตัว
					</Link>
				</div>
			</footer>
		</div>
	);
}
