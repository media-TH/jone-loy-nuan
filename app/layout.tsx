import type { Metadata, Viewport } from "next";
import { Chakra_Petch, IBM_Plex_Mono, IBM_Plex_Sans_Thai_Looped } from "next/font/google";
import { MotionProvider } from "@/components/motion/motion-provider";
import { JsonLd } from "@/lib/seo/json-ld";
import { baseOpenGraph, siteRobots } from "@/lib/seo/metadata";
import {
	PUBLISHERS,
	SITE_DESCRIPTION,
	SITE_NAME,
	SITE_TAGLINE,
	SITE_URL,
} from "@/lib/seo/site";
import { siteJsonLd } from "@/lib/seo/structured-data";
import "./globals.css";

/** Display: headlines, numerals, labels (Thai + Latin, angular "scanner" voice). */
const chakra = Chakra_Petch({
	variable: "--font-chakra",
	subsets: ["thai", "latin"],
	weight: ["600", "700"],
	display: "swap",
});

/** Body: looped Thai for the most legible running text, including for older readers. */
const plexLooped = IBM_Plex_Sans_Thai_Looped({
	variable: "--font-plex-looped",
	subsets: ["thai", "latin"],
	weight: ["400", "500", "600"],
	display: "swap",
});

/** Evidence: phone numbers, URLs, account numbers, sender IDs. */
const plexMono = IBM_Plex_Mono({
	variable: "--font-plex-mono",
	subsets: ["latin"],
	weight: ["400", "500"],
	display: "swap",
});

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	viewportFit: "cover",
	themeColor: "#f5f9ff",
};

export const metadata: Metadata = {
	metadataBase: new URL(SITE_URL),
	title: {
		default: `${SITE_NAME} - ${SITE_TAGLINE}`,
		template: `%s | ${SITE_NAME}`,
	},
	description: SITE_DESCRIPTION,
	applicationName: SITE_NAME,
	keywords: [
		"การโกงออนไลน์",
		"มิจฉาชีพ",
		"แก๊งคอลเซ็นเตอร์",
		"แบบทดสอบ",
		"ความปลอดภัย",
		"ธนาคารแห่งประเทศไทย",
		"กองทุนพัฒนาสื่อ",
	],
	authors: PUBLISHERS.map((org) => ({ name: org.alternateName, url: org.url })),
	creator: PUBLISHERS[0].alternateName,
	publisher: PUBLISHERS[0].alternateName,
	formatDetection: {
		email: false,
		address: false,
		telephone: false,
	},
	// "./" resolves against each page's own path: every page is its own canonical by default.
	alternates: {
		canonical: "./",
	},
	// app/favicon.ico and app/manifest.ts are linked automatically by their file conventions.
	icons: {
		icon: [
			{ url: "/favicon.svg", type: "image/svg+xml" },
			{ url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
		],
		apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
	},
	// Images come from app/opengraph-image.tsx (and per-route opengraph-image files).
	openGraph: baseOpenGraph,
	twitter: {
		card: "summary_large_image",
	},
	robots: siteRobots,
	...(process.env.GOOGLE_SITE_VERIFICATION
		? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } }
		: {}),
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="th"
			className={`${chakra.variable} ${plexLooped.variable} ${plexMono.variable}`}
		>
			<body className="font-sans antialiased">
				<JsonLd data={siteJsonLd()} />
				<MotionProvider>{children}</MotionProvider>
			</body>
		</html>
	);
}
