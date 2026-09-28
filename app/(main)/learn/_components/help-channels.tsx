import { IconExternalLink, IconPhone } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

/**
 * The official channels to contact when a scam is suspected or has happened. Only real,
 * verifiable channels belong here.
 */
const CHANNELS = [
	{
		id: "aoc",
		name: "สายด่วน 1441",
		org: "ศูนย์ปฏิบัติการแก้ไขปัญหาอาชญากรรมออนไลน์ (AOC)",
		use: "แจ้งเหตุเมื่อถูกหลอกหรือโอนเงินไปแล้ว เพื่อขอระงับบัญชีปลายทาง",
		href: "tel:1441",
		external: false,
	},
	{
		id: "fcc",
		name: "สายด่วน 1213",
		org: "ศูนย์คุ้มครองผู้ใช้บริการทางการเงิน ธนาคารแห่งประเทศไทย",
		use: "ปรึกษาหรือร้องเรียนปัญหาเกี่ยวกับบัญชีและบริการทางการเงิน",
		href: "tel:1213",
		external: false,
	},
	{
		id: "police",
		name: "thaipoliceonline.go.th",
		org: "ระบบแจ้งความออนไลน์ สำนักงานตำรวจแห่งชาติ",
		use: "แจ้งความออนไลน์ พร้อมแนบหลักฐาน เช่น สลิปโอนเงินและข้อความแชต",
		href: "https://www.thaipoliceonline.go.th",
		external: true,
	},
] as const;

type HelpChannelsProps = {
	/** id of the section's <h2>; must be unique on the page. */
	headingId?: string;
	className?: string;
};

export function HelpChannels({ headingId = "help-channels", className }: HelpChannelsProps) {
	return (
		<section aria-labelledby={headingId} className={cn("flex flex-col gap-4", className)}>
			<div className="flex flex-col gap-1">
				<h2 id={headingId} className="type-title text-ink">
					ถ้าถูกหลอก หรือไม่แน่ใจ
				</h2>
				<p className="type-body text-ink-muted">
					หยุดโอนเงินทันที โทรหาธนาคารของคุณด้วยเบอร์ทางการ แล้วติดต่อช่องทางเหล่านี้ให้เร็วที่สุด
				</p>
			</div>
			<ul className="flex flex-col gap-3">
				{CHANNELS.map((channel) => (
					<li key={channel.id}>
						<a
							href={channel.href}
							{...(channel.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
							className={cn(
								"focus-ring flex items-start gap-4 rounded-md border-2 border-line-strong bg-surface-raised p-4",
								"transition-colors duration-(--dur-quick) ease-settle hover:bg-brand-soft",
							)}
						>
							<span
								aria-hidden
								className="grid size-11 shrink-0 place-items-center rounded-pill bg-brand text-on-brand [&_svg]:size-5"
							>
								{channel.external ? <IconExternalLink stroke={2.25} /> : <IconPhone stroke={2.25} />}
							</span>
							<span className="flex min-w-0 flex-col gap-0.5">
								<span className="font-display text-lg font-bold break-words text-ink">
									{channel.name}
									{channel.external ? <span className="sr-only"> (เปิดในแท็บใหม่)</span> : null}
								</span>
								<span className="type-body-sm font-semibold text-ink">{channel.org}</span>
								<span className="type-body-sm text-ink-muted">{channel.use}</span>
							</span>
						</a>
					</li>
				))}
			</ul>
		</section>
	);
}
