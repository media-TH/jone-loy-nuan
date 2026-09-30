import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import {
	ANON_TOKEN_TTL_HOURS,
	CONTROLLER,
	POLICY_EFFECTIVE_DATE_LABEL,
	POLICY_VERSION,
	PRIVACY_SECTION_IDS,
	PROCESSORS,
	RETENTION,
	SUPERVISORY_AUTHORITY,
} from "@/lib/privacy/policy";
import { PUBLISHERS } from "@/lib/seo/site";
import { DeleteMyData, WithdrawConsent } from "./privacy-actions";

/**
 * /privacy — a short, plain-language privacy notice plus the self-service controls it promises
 * (withdraw consent, erase my data). Facts that must match the consent UI and the retention job
 * (months, token lifetime, contact) come from lib/privacy/policy.ts. Public and indexable.
 */

export const metadata: Metadata = {
	title: "ความเป็นส่วนตัว",
	description:
		"สแกนโจร.online เก็บข้อมูลอะไร ใช้ทำอะไร เก็บนานเท่าไร และถอนความยินยอมหรือลบข้อมูลของคุณเองได้ที่หน้านี้",
};

const linkClass =
	"focus-ring rounded-xs font-semibold text-brand underline decoration-2 underline-offset-4 hover:decoration-4";
/** Links that stand on their own line get the 44px minimum touch target. */
const blockLinkClass = `${linkClass} inline-flex min-h-11 items-center`;

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
	const headingId = `${id}-heading`;
	return (
		<section id={id} aria-labelledby={headingId} className="flex scroll-mt-6 flex-col gap-3">
			<h2 id={headingId} className="type-title text-ink">
				{title}
			</h2>
			{children}
		</section>
	);
}

function Prose({ children }: { children: ReactNode }) {
	return <p className="type-body text-ink">{children}</p>;
}

function BulletList({ items }: { items: readonly ReactNode[] }) {
	return (
		<ul className="type-body flex list-disc flex-col gap-2 pl-6 text-ink marker:text-ink-muted">
			{items.map((item, index) => (
				<li key={index}>{item}</li>
			))}
		</ul>
	);
}

function ContactEmail() {
	const email = CONTROLLER.email?.trim();
	if (!email) return <>ผู้ดูแลระบบ</>;
	return (
		<a href={`mailto:${email}`} className={linkClass}>
			{email}
		</a>
	);
}

export default function PrivacyPage() {
	const [bot, tmf] = PUBLISHERS;
	const processorNames = PROCESSORS.map((processor) => processor.name).join(" และ ");

	return (
		<main className="min-h-dvh bg-surface text-ink">
			<article className="mx-auto flex w-full max-w-[40rem] flex-col gap-8 px-4 pt-8 pb-16 sm:px-6 sm:pt-12">
				<header className="flex flex-col gap-4">
					<Link href="/" className={`${blockLinkClass} type-body self-start`}>
						กลับหน้าแรก
					</Link>
					<h1 className="type-display-lg text-ink">ความเป็นส่วนตัว</h1>
					<p className="type-body-lg text-ink">
						สแกนโจร.online จัดทำโดย{bot.name} ร่วมกับ{tmf.name} เล่นได้โดยไม่ต้องสมัครสมาชิก
						เราไม่ถามชื่อ เบอร์โทรศัพท์ หรืออีเมลของคุณ
					</p>
				</header>

				<Section id="data" title="เราเก็บอะไร">
					<BulletList
						items={[
							"คำตอบและคะแนนแบบทดสอบ ผูกกับรหัสสุ่มในแท็บเบราว์เซอร์ ไม่ใช่ตัวคุณ",
							"ประเภทอุปกรณ์และเบราว์เซอร์ที่ใช้",
							"แบบสอบถาม (ช่วงอายุ เพศ จังหวัด การศึกษา อาชีพ) เฉพาะเมื่อคุณยินยอม และไม่เก็บเลยถ้าคุณอายุต่ำกว่า 20 ปี",
						]}
					/>
				</Section>

				<Section id="purposes" title="ใช้ทำอะไร">
					<Prose>
						เพื่อแสดงผลลัพธ์ให้คุณ และรวมเป็นสถิติภาพรวมเพื่อปรับปรุงเนื้อหาให้คนไทยรู้เท่าทันมิจฉาชีพ
						เราไม่ขายข้อมูล ไม่ใช้เพื่อโฆษณา และไม่ใช้คุกกี้ติดตามตัวคุณ
					</Prose>
				</Section>

				<Section id="retention" title="เก็บนานแค่ไหน">
					<BulletList
						items={[
							`แบบสอบถาม: ${RETENTION.demographics.months} เดือน แล้วรวมเป็นตัวเลขสถิติและลบข้อมูลรายคน`,
							`ผลแบบทดสอบ: ${RETENTION.quizSessions.months} เดือน แล้วตัดรหัสสุ่มออก เหลือเป็นสถิติที่ไม่ระบุตัวตน`,
							"ระบบลบให้อัตโนมัติเมื่อครบกำหนด",
						]}
					/>
				</Section>

				<Section id="recipients" title="ใครเห็นข้อมูลบ้าง">
					<Prose>
						เฉพาะทีมผู้จัดทำที่ได้รับอนุญาต และผู้ให้บริการระบบ ({processorNames})
						ซึ่งอาจเก็บข้อมูลบนเซิร์ฟเวอร์นอกประเทศไทย
					</Prose>
				</Section>

				<Section id="rights" title="สิทธิของคุณ">
					<Prose>
						คุณขอดู ขอแก้ ขอลบข้อมูล หรือถอนความยินยอมได้ทุกเมื่อ ทำเองได้ที่ปุ่มด้านล่าง
						หรือติดต่อ <ContactEmail /> เราจะตอบภายใน 30 วัน หากเห็นว่าเราไม่ปฏิบัติตามกฎหมาย
						ร้องเรียนได้ที่{" "}
						<a href={SUPERVISORY_AUTHORITY.url} className={linkClass} rel="noopener noreferrer">
							{SUPERVISORY_AUTHORITY.name}
						</a>
					</Prose>
					<p className="type-body-sm text-ink-muted">
						ปุ่มด้านล่างใช้ได้จากแท็บที่ใช้เล่นแบบทดสอบ ภายใน {ANON_TOKEN_TTL_HOURS} ชั่วโมง
						หลังจากนั้นเราไม่รู้แล้วว่าข้อมูลใดเป็นของคุณ
					</p>
				</Section>

				<Section id={PRIVACY_SECTION_IDS.withdraw} title="ถอนความยินยอม">
					<Prose>ลบคำตอบแบบสอบถามของคุณ ผลแบบทดสอบยังอยู่ตามปกติ</Prose>
					<WithdrawConsent />
				</Section>

				<Section id={PRIVACY_SECTION_IDS.erase} title="ลบข้อมูลของฉัน">
					<Prose>ลบทุกอย่างของคุณ ทั้งผลแบบทดสอบ คำตอบ และแบบสอบถาม</Prose>
					<DeleteMyData />
				</Section>

				<p className="type-body-sm text-ink-muted">
					ฉบับ {POLICY_VERSION} · มีผลตั้งแต่ {POLICY_EFFECTIVE_DATE_LABEL} ·
					ถ้าเปลี่ยนเรื่องที่ต้องขอความยินยอม เราจะขอคุณใหม่
				</p>
			</article>
		</main>
	);
}
