import type { Metadata } from "next";
import type { ReactNode } from "react";
import { privatePageRobots } from "@/lib/seo/metadata";

/** Metadata only: the survey is per-session and must never be indexed. */
export const metadata: Metadata = {
	title: "แบบสอบถามหลังทำแบบทดสอบ",
	robots: privatePageRobots,
};

export default function SurveyLayout({ children }: { children: ReactNode }) {
	return children;
}
