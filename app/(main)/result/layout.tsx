import type { Metadata } from "next";
import type { ReactNode } from "react";
import { privatePageRobots } from "@/lib/seo/metadata";

/**
 * Metadata only: a result belongs to one person's session, so it is never indexed. Sharing goes
 * through /s/{score} (lib/seo/share.ts), which carries the score and nothing else.
 */
export const metadata: Metadata = {
	title: "ผลการสแกนของคุณ",
	robots: privatePageRobots,
};

export default function ResultLayout({ children }: { children: ReactNode }) {
	return children;
}
