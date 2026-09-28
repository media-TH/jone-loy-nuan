import type { Metadata, Viewport } from "next";
import { Chakra_Petch, IBM_Plex_Mono, IBM_Plex_Sans_Thai_Looped } from "next/font/google";
import { MotionProvider } from "@/components/motion/motion-provider";
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
	title: "สแกนโจร.online - แบบทดสอบความรู้เท่าทันมิจฉาชีพ",
	description:
		"เรียนรู้วิธีป้องกันตัวเองจากการโกงออนไลน์ ผ่านแบบทดสอบที่เข้าใจง่าย พร้อมสถานการณ์จำลองที่ใกล้เคียงชีวิตจริง",
	keywords: [
		"การโกงออนไลน์",
		"มิจฉาชีพ",
		"แบบทดสอบ",
		"ความปลอดภัย",
		"ธนาคารแห่งประเทศไทย",
		"กองทุนพัฒนาสื่อ",
	],
	authors: [{ name: "Bank of Thailand" }, { name: "Thai Media Fund" }],
	creator: "Bank of Thailand",
	publisher: "Bank of Thailand",
	formatDetection: {
		email: false,
		address: false,
		telephone: false,
	},
	metadataBase: new URL("https://xn--12co4czb5a2kj.online"),
	alternates: {
		canonical: "/",
	},
	icons: {
		icon: [
			{ url: "/favicon.ico" },
			{ url: "/icon-16x16.png", sizes: "16x16", type: "image/png" },
			{ url: "/icon-32x32.png", sizes: "32x32", type: "image/png" },
		],
		apple: [
			{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
		],
		other: [
			{ rel: "mask-icon", url: "/safari-pinned-tab.svg", color: "#5bbad5" },
		],
	},
	manifest: "/site.webmanifest",
	openGraph: {
		title: "สแกนโจร.online - แบบทดสอบความรู้เท่าทันมิจฉาชีพ",
		description:
			"เรียนรู้วิธีป้องกันตัวเองจากการโกงออนไลน์ ผ่านแบบทดสอบที่เข้าใจง่าย",
		url: "https://xn--12co4czb5a2kj.online",
		siteName: "สแกนโจร.online",
		locale: "th_TH",
		type: "website",
		images: [
			{
				url: "/og-image.jpg",
				width: 1200,
				height: 630,
				alt: "สแกนโจร.online - แบบทดสอบความรู้เท่าทันมิจฉาชีพ",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "สแกนโจร.online - แบบทดสอบความรู้เท่าทันมิจฉาชีพ",
		description: "เรียนรู้วิธีป้องกันตัวเองจากการโกงออนไลน์",
		images: ["/og-image.jpg"],
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-video-preview": -1,
			"max-image-preview": "large",
			"max-snippet": -1,
		},
	},
	verification: {
		google: "your-google-verification-code",
	},
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
				<MotionProvider>{children}</MotionProvider>
			</body>
		</html>
	);
}
