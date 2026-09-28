import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { IconLock, IconToggleRight } from "@tabler/icons-react";
import { StatusBadge } from "@/components/ds/status-badge";
import {
	ANON_TOKEN_TTL_HOURS,
	CLIENT_STORAGE,
	CONTROLLER,
	DATA_INVENTORY,
	LAWFUL_BASES,
	POLICY_EFFECTIVE_DATE_LABEL,
	POLICY_VERSION,
	PRIVACY_SECTION_IDS,
	PROCESSORS,
	PURPOSES,
	RETENTION,
	RETENTION_JOB,
	SUPERVISORY_AUTHORITY,
	controllerValue,
	type PrivacyPurpose,
} from "@/lib/privacy/policy";
import { PUBLISHERS } from "@/lib/seo/site";
import { DeleteMyData, WithdrawConsent } from "./privacy-actions";

/**
 * /privacy — the privacy notice required by PDPA s.23, plus the self-service controls it promises
 * (withdraw consent, erase my data). Every fact comes from lib/privacy/policy.ts so the notice,
 * the consent UI and the database retention job cannot drift apart. Public and indexable.
 */

export const metadata: Metadata = {
	title: "ประกาศความเป็นส่วนตัว",
	description:
		"สแกนโจร.online เก็บข้อมูลอะไร ใช้ทำอะไร เก็บนานเท่าไร และคุณใช้สิทธิตาม พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคลได้อย่างไร พร้อมถอนความยินยอมและลบข้อมูลของคุณเองได้ที่หน้านี้",
};

const SECTIONS = [
	{ id: "controller", title: "ผู้ควบคุมข้อมูลและช่องทางติดต่อ" },
	{ id: "data", title: "ข้อมูลที่เราเก็บ" },
	{ id: "purposes", title: "วัตถุประสงค์และฐานทางกฎหมาย" },
	{ id: "retention", title: "ระยะเวลาการเก็บรักษา" },
	{ id: "recipients", title: "ผู้รับข้อมูลและการส่งข้อมูลไปต่างประเทศ" },
	{ id: "rights", title: "สิทธิของคุณ" },
	{ id: PRIVACY_SECTION_IDS.withdraw, title: "ถอนความยินยอม" },
	{ id: PRIVACY_SECTION_IDS.erase, title: "ลบข้อมูลของฉัน" },
	{ id: "security", title: "การรักษาความมั่นคงปลอดภัย" },
	{ id: "storage", title: "คุกกี้และพื้นที่จัดเก็บในเบราว์เซอร์" },
	{ id: "minors", title: "ผู้เยาว์" },
	{ id: "changes", title: "การเปลี่ยนแปลงประกาศนี้" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

const linkClass =
	"focus-ring rounded-xs font-semibold text-brand underline decoration-2 underline-offset-4 hover:decoration-4";

/** Storage keys: plain body type in a sunken chip (mono is reserved for scam evidence). */
const keyClass = "rounded-xs bg-surface-sunken px-1.5 py-0.5 font-sans font-semibold text-ink";

function Section({ id, children }: { id: SectionId; children: ReactNode }) {
	const title = SECTIONS.find((section) => section.id === id)?.title;
	const headingId = `${id}-heading`;
	return (
		<section id={id} aria-labelledby={headingId} className="flex scroll-mt-6 flex-col gap-4">
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

function BasisBadge({ basis }: { basis: PrivacyPurpose["basis"] }) {
	return basis === "consent" ? (
		<StatusBadge tone="neutral" icon={<IconToggleRight stroke={2.25} />}>
			เลือกได้ · ต้องได้รับความยินยอม
		</StatusBadge>
	) : (
		<StatusBadge tone="neutral" icon={<IconLock stroke={2.25} />}>
			จำเป็นต่อการให้บริการ
		</StatusBadge>
	);
}

function ContactValue({ value, href }: { value: string | null; href?: string }) {
	const text = controllerValue(value);
	if (!value?.trim() || !href) return <>{text}</>;
	return (
		<a href={href} className={linkClass}>
			{text}
		</a>
	);
}

/**
 * The data inventory as a real table. Below `sm` each row becomes a card; the explicit ARIA roles
 * keep the table semantics that the `display` change would otherwise drop in some browsers.
 */
function DataInventoryTable() {
	const cell = "block align-top sm:table-cell sm:px-4 sm:py-4";
	const mobileLabel = "type-label mb-1 block text-ink-muted sm:hidden";

	return (
		<div className="overflow-hidden rounded-md border-2 border-line bg-surface-raised">
			<table role="table" className="block w-full text-left sm:table sm:border-collapse">
				<caption className="sr-only">
					ข้อมูลที่ สแกนโจร.online เก็บ พร้อมฐานทางกฎหมายและระยะเวลาการเก็บรักษา
				</caption>
				<thead role="rowgroup" className="sr-only sm:not-sr-only sm:table-header-group">
					<tr role="row" className="sm:border-b-2 sm:border-line">
						<th role="columnheader" scope="col" className="type-label px-4 py-3 text-ink-muted">
							ข้อมูล
						</th>
						<th role="columnheader" scope="col" className="type-label px-4 py-3 text-ink-muted">
							ใช้เพื่อ
						</th>
						<th role="columnheader" scope="col" className="type-label px-4 py-3 text-ink-muted">
							เก็บนานเท่าไร
						</th>
					</tr>
				</thead>
				<tbody role="rowgroup" className="block sm:table-row-group">
					{DATA_INVENTORY.map((item) => {
						const basis = LAWFUL_BASES[item.lawfulBasis];
						return (
							<tr
								key={item.id}
								role="row"
								className="flex flex-col gap-3 border-b border-line p-4 last:border-b-0 sm:table-row sm:p-0"
							>
								<th role="rowheader" scope="row" className={`${cell} font-normal`}>
									<span className="type-body block font-semibold text-ink">
										{item.title}
										{"optional" in item && item.optional ? (
											<span className="type-body-sm font-normal text-ink-muted"> (ไม่บังคับ)</span>
										) : null}
									</span>
									<span className="type-body-sm mt-1 block text-ink">{item.items}</span>
									<span className="type-body-sm mt-1 block text-ink-muted">เก็บที่ {item.storedIn}</span>
								</th>
								<td role="cell" className={cell}>
									<span aria-hidden className={mobileLabel}>
										ใช้เพื่อ
									</span>
									<span className="type-body-sm block text-ink">{item.purpose}</span>
									<span className="type-body-sm mt-1 block text-ink-muted">
										ฐาน: {basis.label} ({basis.section})
									</span>
								</td>
								<td role="cell" className={cell}>
									<span aria-hidden className={mobileLabel}>
										เก็บนานเท่าไร
									</span>
									<span className="type-body-sm block text-ink">{item.retention}</span>
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
}

export default function PrivacyPage() {
	const [bot, tmf] = PUBLISHERS;
	const consentLogYears = RETENTION.consentLog.months / 12;

	return (
		<main className="min-h-dvh bg-surface text-ink">
			<article className="mx-auto flex w-full max-w-[40rem] flex-col gap-10 px-4 pt-8 pb-16 sm:px-6 sm:pt-12">
				<header className="flex flex-col gap-4">
					<Link href="/" className={`${linkClass} type-body self-start`}>
						กลับหน้าแรก
					</Link>
					<p className="type-label text-ink-muted">ประกาศความเป็นส่วนตัว · Privacy Notice</p>
					<h1 className="type-display-lg text-ink">เราดูแลข้อมูลของคุณอย่างไร</h1>
					<p className="type-body-lg text-ink">
						สแกนโจร.online เป็นแบบทดสอบความรู้เท่าทันมิจฉาชีพ จัดทำโดย{bot.name} ร่วมกับ{tmf.name}{" "}
						ประกาศนี้อธิบายตามมาตรา 23 แห่งพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562
						ว่าเราเก็บข้อมูลอะไร ใช้ทำอะไร เก็บนานเท่าไร และคุณใช้สิทธิของคุณได้อย่างไร
					</p>
					<p className="type-body-sm text-ink-muted">
						ฉบับ {POLICY_VERSION} · มีผลตั้งแต่ {POLICY_EFFECTIVE_DATE_LABEL}
					</p>
				</header>

				<section
					aria-labelledby="summary-heading"
					className="flex flex-col gap-3 rounded-md border-2 border-line bg-surface-raised p-4 sm:p-5"
				>
					<h2 id="summary-heading" className="type-title text-ink">
						สรุปสั้น ๆ
					</h2>
					<BulletList
						items={[
							"เล่นได้โดยไม่ต้องสมัครสมาชิก เราไม่ถามชื่อ เบอร์โทรศัพท์ อีเมล หรือเลขประจำตัว",
							"คำตอบของคุณผูกกับรหัสสุ่มในแท็บเบราว์เซอร์เท่านั้น",
							"ข้อมูลประชากรเป็นทางเลือก เก็บเมื่อคุณยินยอมเท่านั้น และถอนความยินยอมได้ทุกเมื่อ",
							"คุณลบข้อมูลของคุณเองได้ทันทีที่หน้านี้",
							"ระบบลบหรือทำให้ข้อมูลไม่ระบุตัวตนโดยอัตโนมัติเมื่อครบกำหนด",
							"เราไม่ขายข้อมูล ไม่ใช้ข้อมูลเพื่อโฆษณา และไม่ใช้คุกกี้ติดตามตัวคุณ",
						]}
					/>
				</section>

				<nav aria-labelledby="toc-heading" className="flex flex-col gap-3">
					<h2 id="toc-heading" className="type-label text-ink-muted">
						หัวข้อในประกาศนี้
					</h2>
					<ol className="type-body flex list-decimal flex-col gap-2 pl-6 marker:text-ink-muted">
						{SECTIONS.map((section) => (
							<li key={section.id}>
								<a href={`#${section.id}`} className={linkClass}>
									{section.title}
								</a>
							</li>
						))}
					</ol>
				</nav>

				<Section id="controller">
					<Prose>
						ผู้ควบคุมข้อมูลส่วนบุคคลคือผู้ตัดสินใจว่าจะเก็บและใช้ข้อมูลของคุณอย่างไร
						หากมีคำถามหรือต้องการใช้สิทธิ ติดต่อได้ตามรายละเอียดนี้
					</Prose>
					<dl className="flex flex-col divide-y divide-line rounded-md border-2 border-line bg-surface-raised px-4">
						{[
							{ term: "ผู้ควบคุมข้อมูลส่วนบุคคล", value: <ContactValue value={CONTROLLER.name} /> },
							{ term: "ที่อยู่", value: <ContactValue value={CONTROLLER.address} /> },
							{
								term: "อีเมลสำหรับใช้สิทธิ",
								value: (
									<ContactValue value={CONTROLLER.email} href={`mailto:${CONTROLLER.email ?? ""}`} />
								),
							},
							{
								term: "เจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล (DPO)",
								value: (
									<ContactValue
										value={CONTROLLER.dpoEmail}
										href={`mailto:${CONTROLLER.dpoEmail ?? ""}`}
									/>
								),
							},
						].map((row) => (
							<div key={row.term} className="flex flex-col gap-1 py-3 sm:flex-row sm:gap-4">
								<dt className="type-body-sm text-ink-muted sm:w-48 sm:shrink-0">{row.term}</dt>
								<dd className="type-body min-w-0 break-words text-ink">{row.value}</dd>
							</div>
						))}
					</dl>
				</Section>

				<Section id="data">
					<Prose>
						เราเก็บเฉพาะข้อมูลที่จำเป็น และออกแบบให้ข้อมูลไม่ผูกกับตัวตนจริงของคุณตั้งแต่ต้น
						เช่น ถามช่วงอายุแทนวันเกิด และถามจังหวัดแทนที่อยู่
					</Prose>
					<DataInventoryTable />
					<Prose>
						เราไม่เก็บข้อมูลส่วนบุคคลที่มีความอ่อนไหวตามมาตรา 26 เช่น ศาสนา สุขภาพ หรือข้อมูลชีวภาพ
						และไม่ใช้ข้อมูลของคุณตัดสินใจเรื่องใดเกี่ยวกับตัวคุณโดยอัตโนมัติ
					</Prose>
				</Section>

				<Section id="purposes">
					<ul className="flex flex-col gap-3">
						{PURPOSES.map((purpose) => {
							const basis = LAWFUL_BASES[purpose.lawfulBasis];
							return (
								<li
									key={purpose.id}
									className="flex flex-col gap-2 rounded-md border-2 border-line bg-surface-raised p-4"
								>
									<div className="flex flex-wrap items-center justify-between gap-2">
										<h3 className="type-body font-semibold text-ink">{purpose.title}</h3>
										<BasisBadge basis={purpose.basis} />
									</div>
									<p className="type-body-sm text-ink">{purpose.description}</p>
									<p className="type-body-sm text-ink-muted">
										ฐานทางกฎหมาย: {basis.label} ({basis.section}) — {basis.summary}
									</p>
								</li>
							);
						})}
					</ul>
					<Prose>
						ถ้าคุณไม่ให้ข้อมูลประชากร คุณยังเล่นแบบทดสอบและดูผลลัพธ์ได้ครบทุกอย่าง
						ส่วนคำตอบในแบบทดสอบจำเป็นต่อการคำนวณผลลัพธ์ หากไม่ต้องการให้เก็บคำตอบ
						คุณเลือกไม่เล่นแบบทดสอบ หรือลบข้อมูลภายหลังได้ที่หน้านี้
					</Prose>
				</Section>

				<Section id="retention">
					<BulletList
						items={[
							`ข้อมูลประชากร: ${RETENTION.demographics.months} เดือนนับจากวันที่ส่งแบบสอบถาม จากนั้นรวมเป็นตัวเลขสถิติรายเดือนแยกทีละหัวข้อ (เช่น จำนวนผู้ตอบแต่ละช่วงอายุ) แล้วลบข้อมูลรายคน`,
							`ผลแบบทดสอบและคำตอบ: ${RETENTION.quizSessions.months} เดือนนับจากวันที่เล่น จากนั้นลบรหัสสุ่ม ข้อความระบุเบราว์เซอร์ และรหัสรอบเดิมออก เหลือเป็นสถิติที่ไม่สามารถระบุตัวบุคคลได้`,
							`บันทึกความยินยอม: ${consentLogYears} ปี เพื่อใช้พิสูจน์ว่าเราใช้ข้อมูลตามที่คุณเลือก แล้วลบ`,
							`รหัสสุ่มในเบราว์เซอร์: จนกว่าจะปิดแท็บ หรือครบ ${ANON_TOKEN_TTL_HOURS} ชั่วโมง`,
						]}
					/>
					<Prose>
						ระบบฐานข้อมูลตรวจและลบหรือทำให้ข้อมูลไม่ระบุตัวตนตามกำหนดนี้โดยอัตโนมัติทุกวันตอน{" "}
						{RETENTION_JOB.localTimeLabel}
					</Prose>
				</Section>

				<Section id="recipients">
					<Prose>
						เราใช้ผู้ให้บริการภายนอกเป็นผู้ประมวลผลข้อมูลส่วนบุคคลแทนเรา
						ซึ่งใช้ข้อมูลได้เฉพาะเพื่อให้บริการแก่เราเท่านั้น
					</Prose>
					<ul className="flex flex-col gap-3">
						{PROCESSORS.map((processor) => (
							<li
								key={processor.id}
								className="flex flex-col gap-1 rounded-md border-2 border-line bg-surface-raised p-4"
							>
								<p className="type-body font-semibold text-ink">{processor.name}</p>
								<p className="type-body-sm text-ink">{processor.role}</p>
								<p className="type-body-sm text-ink-muted">ที่ตั้งการประมวลผล: {processor.location}</p>
							</li>
						))}
					</ul>
					<BulletList
						items={[
							"เจ้าหน้าที่ของผู้จัดทำที่ได้รับอนุญาตเท่านั้นที่เข้าระบบจัดการได้ เพื่อดูสถิติและดูแลเนื้อหา",
							"เราไม่ขาย ไม่ให้เช่า และไม่ส่งข้อมูลให้ผู้อื่นเพื่อการตลาด เว้นแต่กฎหมายกำหนดให้ต้องเปิดเผยต่อหน่วยงานของรัฐ",
						]}
					/>
					<h3 className="type-body font-semibold text-ink">การส่งข้อมูลไปต่างประเทศ (มาตรา 28–29)</h3>
					<Prose>
						ผู้ให้บริการทั้งสองรายอาจจัดเก็บหรือประมวลผลข้อมูลนอกประเทศไทย
						ฐานข้อมูลตั้งอยู่ตามภูมิภาคที่ผู้ดูแลระบบตั้งค่า (แนะนำสิงคโปร์)
						เราส่งข้อมูลไปต่างประเทศเท่าที่จำเป็นต่อการให้บริการ
						ภายใต้ข้อตกลงการประมวลผลข้อมูลของผู้ให้บริการซึ่งกำหนดมาตรการคุ้มครองที่เหมาะสม
						และข้อมูลที่ส่งไม่มีชื่อหรือช่องทางติดต่อของคุณ
					</Prose>
				</Section>

				<Section id="rights">
					<Prose>ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 คุณมีสิทธิต่อไปนี้โดยไม่มีค่าใช้จ่าย</Prose>
					<BulletList
						items={[
							"ถอนความยินยอมเมื่อใดก็ได้ ง่ายเท่ากับตอนให้ โดยไม่กระทบการใช้ข้อมูลที่ทำไปแล้วโดยชอบ (มาตรา 19)",
							"ขอเข้าถึงและขอรับสำเนาข้อมูลของคุณ (มาตรา 30)",
							"ขอรับข้อมูลในรูปแบบที่อ่านด้วยเครื่องมือทั่วไปได้ หรือขอให้ส่งต่อไปยังผู้อื่น (มาตรา 31)",
							"คัดค้านการใช้ข้อมูลที่อาศัยฐานประโยชน์โดยชอบด้วยกฎหมาย (มาตรา 32)",
							"ขอให้ลบ ทำลาย หรือทำให้ข้อมูลไม่สามารถระบุตัวคุณได้ (มาตรา 33)",
							"ขอให้ระงับการใช้ข้อมูลไว้ชั่วคราว (มาตรา 34)",
							"ขอให้แก้ไขข้อมูลให้ถูกต้อง เป็นปัจจุบัน และสมบูรณ์ (มาตรา 35–36)",
							<>
								ร้องเรียนต่อ{SUPERVISORY_AUTHORITY.name} หากเห็นว่าเราไม่ปฏิบัติตามกฎหมาย (มาตรา 73) ที่{" "}
								<a href={SUPERVISORY_AUTHORITY.url} className={linkClass} rel="noopener noreferrer">
									pdpc.or.th
								</a>
							</>,
						]}
					/>
					<Prose>
						ถอนความยินยอมและลบข้อมูลได้ด้วยตัวเองทันทีที่หน้านี้ สำหรับสิทธิอื่น
						ติดต่อผู้ควบคุมข้อมูลตามช่องทางใน
						<a href="#controller" className={linkClass}>
							หัวข้อแรก
						</a>{" "}
						เราจะตอบกลับภายใน 30 วันนับแต่ได้รับคำขอ
					</Prose>
					<Prose>
						เนื่องจากเราไม่รู้ว่าคุณเป็นใคร ข้อมูลของคุณผูกกับรหัสสุ่มในแท็บเบราว์เซอร์เท่านั้น
						เมื่อปิดแท็บหรือครบ {ANON_TOKEN_TTL_HOURS} ชั่วโมง เราจะไม่มีทางรู้ว่าข้อมูลใดเป็นของคุณ
						จึงอาจทำตามคำขอบางอย่างไม่ได้ แต่ในทางกลับกัน ข้อมูลนั้นก็ไม่สามารถเชื่อมโยงกลับมาหาคุณได้เช่นกัน
					</Prose>
				</Section>

				<Section id={PRIVACY_SECTION_IDS.withdraw}>
					<Prose>
						ถ้าคุณเคยยินยอมให้เก็บข้อมูลประชากรในแท็บนี้ กดปุ่มด้านล่างเพื่อถอนความยินยอม
						เราจะบันทึกการถอนและลบข้อมูลประชากรของคุณทันที ผลแบบทดสอบยังอยู่ตามปกติ
					</Prose>
					<WithdrawConsent />
				</Section>

				<Section id={PRIVACY_SECTION_IDS.erase}>
					<Prose>
						ลบทุกอย่างที่ผูกกับรหัสสุ่มในแท็บนี้ ทั้งผลแบบทดสอบ คำตอบ ข้อมูลประชากร บันทึกความยินยอม
						และข้อมูลที่เก็บไว้ในเบราว์เซอร์นี้ ใช้ได้เมื่อยังไม่ได้ปิดแท็บที่ใช้เล่นแบบทดสอบ
					</Prose>
					<DeleteMyData />
				</Section>

				<Section id="security">
					<Prose>เราใช้มาตรการรักษาความมั่นคงปลอดภัยที่เหมาะสมตามมาตรา 37 ได้แก่</Prose>
					<BulletList
						items={[
							"เข้ารหัสการรับส่งข้อมูลทุกหน้าด้วย HTTPS",
							"ฐานข้อมูลจำกัดสิทธิรายแถว (Row Level Security): รหัสสุ่มแต่ละรหัสเห็นและเพิ่มได้เฉพาะข้อมูลของตัวเอง",
							"กุญแจสิทธิสูงสุดของฐานข้อมูลใช้บนเซิร์ฟเวอร์เท่านั้น ไม่เคยส่งไปยังเบราว์เซอร์",
							"ตรวจข้อมูลที่ส่งเข้ามาบนเซิร์ฟเวอร์ทุกครั้ง และรับเฉพาะตัวเลือกจากรายการที่กำหนด ไม่รับข้อความอิสระ",
							"บันทึกความยินยอมเพิ่มได้อย่างเดียว แก้ไขย้อนหลังไม่ได้",
							"ลบหรือทำให้ข้อมูลไม่ระบุตัวตนโดยอัตโนมัติเมื่อครบกำหนด",
							"จำกัดการเข้าระบบจัดการเฉพาะเจ้าหน้าที่ที่ได้รับอนุญาต",
							"หากเกิดเหตุละเมิดข้อมูลส่วนบุคคลที่มีความเสี่ยงต่อสิทธิของคุณ เราจะแจ้งสำนักงานคณะกรรมการคุ้มครองข้อมูลส่วนบุคคลภายใน 72 ชั่วโมงนับแต่ทราบเหตุ และแจ้งคุณพร้อมแนวทางเยียวยาหากมีความเสี่ยงสูง",
						]}
					/>
				</Section>

				<Section id="storage">
					<Prose>
						เว็บไซต์นี้ไม่ใช้คุกกี้กับผู้เล่นทั่วไป ไม่มีคุกกี้โฆษณาหรือคุกกี้ติดตามข้ามเว็บไซต์
						สิ่งที่เก็บไว้ในเบราว์เซอร์ของคุณมีเพียงรายการต่อไปนี้
					</Prose>
					<ul className="flex flex-col gap-3">
						{CLIENT_STORAGE.map((entry) => (
							<li
								key={entry.key}
								className="flex flex-col gap-1 rounded-md border-2 border-line bg-surface-raised p-4"
							>
								<p className="type-body text-ink">
									<code className={keyClass}>{entry.key}</code>{" "}
									<span className="type-body-sm text-ink-muted">
										({entry.area}
										{"legacy" in entry && entry.legacy ? " · จากเวอร์ชันก่อน" : ""})
									</span>
								</p>
								<p className="type-body-sm text-ink">{entry.contains}</p>
								<p className="type-body-sm text-ink-muted">
									{entry.purpose} · อายุ: {entry.lifetime}
								</p>
							</li>
						))}
					</ul>
					<Prose>
						คุกกี้ของระบบจัดการ (<code className={keyClass}>sb-…-auth-token</code> สำหรับการเข้าสู่ระบบ และ{" "}
						<code className={keyClass}>sidebar_state</code> สำหรับจำการแสดงเมนู)
						ใช้เฉพาะกับเจ้าหน้าที่ที่เข้าสู่ระบบจัดการเท่านั้น
						ปุ่ม “ลบข้อมูลของฉัน” จะล้างรายการข้างต้นออกจากเบราว์เซอร์นี้ให้ทันที
					</Prose>
				</Section>

				<Section id="minors">
					<Prose>
						แบบทดสอบนี้เหมาะกับทุกวัย รวมถึงเด็กและเยาวชน และเล่นได้โดยไม่ต้องให้ข้อมูลที่ระบุตัวตน
						ถ้าคุณเลือกช่วงอายุต่ำกว่า 20 ปีในแบบสอบถาม เราจะเก็บเฉพาะช่วงอายุ
						ไม่เก็บเพศ จังหวัด ระดับการศึกษา หรืออาชีพ (มาตรา 20)
						ผู้ปกครองถอนความยินยอมหรือลบข้อมูลแทนได้จากหน้านี้บนอุปกรณ์เดียวกัน
						หรือติดต่อผู้ควบคุมข้อมูลตามหัวข้อแรก
					</Prose>
				</Section>

				<Section id="changes">
					<Prose>
						เราอาจปรับปรุงประกาศนี้เมื่อข้อมูลที่เก็บ วัตถุประสงค์ หรือผู้ให้บริการเปลี่ยนไป
						ฉบับล่าสุดอยู่ที่หน้านี้เสมอ พร้อมเลขฉบับและวันที่มีผล ทุกความยินยอมบันทึกไว้พร้อมฉบับของประกาศ
						หากมีการเปลี่ยนแปลงในเรื่องที่ต้องได้รับความยินยอม เราจะขอความยินยอมจากคุณใหม่
					</Prose>
					<p className="type-body-sm text-ink-muted">
						ฉบับ {POLICY_VERSION} · มีผลตั้งแต่ {POLICY_EFFECTIVE_DATE_LABEL}
					</p>
				</Section>
			</article>
		</main>
	);
}
