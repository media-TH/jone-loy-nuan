import { IconPhone } from "@tabler/icons-react";

/** Official hotlines only; the numbers stay visible (not just behind a tap) so they can be noted down. */
const HOTLINES = [
	{
		number: "1441",
		org: "ศูนย์ AOC รับแจ้งอาชญากรรมออนไลน์",
		use: "ถูกหลอกหรือโอนเงินไปแล้ว แจ้งเพื่อขอระงับบัญชีปลายทางให้เร็วที่สุด",
	},
	{
		number: "1213",
		org: "ศูนย์คุ้มครองผู้ใช้บริการทางการเงิน ธปท.",
		use: "ปรึกษาหรือร้องเรียนปัญหาเกี่ยวกับบัญชีและบริการทางการเงิน",
	},
] as const;

/** Help box on the result: who to call when a scam is suspected or has happened. */
export function HelpLines() {
	return (
		<section aria-labelledby="help-title" className="flex flex-col gap-4 rounded-lg bg-brand-soft p-5">
			<div className="flex flex-col gap-1">
				<h2 id="help-title" className="type-title text-ink">
					ถ้าถูกหลอก หรือไม่แน่ใจ
				</h2>
				<p className="type-body text-ink">
					อย่าเพิ่งโอนเงินหรือให้ข้อมูลใด ๆ โทรปรึกษาสายด่วนเหล่านี้ได้เลย
				</p>
			</div>
			<ul role="list" className="flex flex-col gap-3">
				{HOTLINES.map((line) => (
					<li key={line.number}>
						<a
							href={`tel:${line.number}`}
							className="focus-ring flex items-start gap-4 rounded-md border-2 border-line-strong bg-surface-raised p-4 transition-colors duration-(--dur-quick) ease-settle hover:border-brand"
						>
							<span
								aria-hidden
								className="grid size-11 shrink-0 place-items-center rounded-pill bg-brand text-on-brand [&_svg]:size-5"
							>
								<IconPhone stroke={2.25} />
							</span>
							<span className="flex min-w-0 flex-col gap-0.5">
								<span className="font-display text-2xl leading-8 font-bold tabular-nums text-ink">
									<span className="sr-only">โทร </span>
									{line.number}
								</span>
								<span className="type-body-sm font-semibold text-ink">{line.org}</span>
								<span className="type-body-sm text-ink-muted">{line.use}</span>
							</span>
						</a>
					</li>
				))}
			</ul>
		</section>
	);
}
