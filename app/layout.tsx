import type { Metadata } from "next";
import { Inter, Prompt } from "next/font/google";
import "./globals.css";

const inter = Inter({
	variable: "--font-inter",
	subsets: ["latin"],
	display: "swap",
});

const prompt = Prompt({
	variable: "--font-prompt",
	subsets: ["thai", "latin"],
	weight: ["300", "400", "500", "600", "700"],
	display: "swap",
});

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
		<html lang="th">
			<meta
				name="viewport"
				content="width=device-width, initial-scale=1, viewport-fit=cover"
			/>
			<body
				className={`${inter.variable} ${prompt.variable} font-sans antialiased`}
			>
				{children}
			</body>
		</html>
	);
}
