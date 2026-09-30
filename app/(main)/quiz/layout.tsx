import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PrivacyNote } from "@/components/privacy/privacy-note";
import { JsonLd } from "@/lib/seo/json-ld";
import { QUIZ_DESCRIPTION, quizJsonLd } from "@/lib/seo/structured-data";

/** Metadata + schema.org Quiz for the (indexable) quiz. The page itself is owned elsewhere. */
export const metadata: Metadata = {
	title: "แบบทดสอบ 10 สถานการณ์จำลอง",
	description: QUIZ_DESCRIPTION,
};

export default function QuizLayout({ children }: { children: ReactNode }) {
	return (
		<>
			<JsonLd data={quizJsonLd()} />
			{children}
			{/* Answers are recorded while playing (s.23): the notice is one tap away on this page. */}
			<footer className="bg-surface">
				<PrivacyNote newTab className="mx-auto w-full max-w-[30rem] px-4 pb-8 sm:px-6" />
			</footer>
		</>
	);
}
