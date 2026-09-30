"use client";

import * as React from "react";
import Link from "next/link";
import { IconLock } from "@tabler/icons-react";
import { StatusBadge } from "@/components/ds/status-badge";
import { cn } from "@/lib/utils";

/**
 * DS ConsentPanel — PDPA (พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562) consent UI.
 *
 * - "necessary" purposes rely on another lawful basis: shown as information only, no toggle.
 * - "consent" purposes each get their own switch (s.19: specific, separate, freely given).
 *   Missing values read as OFF, nothing is pre-ticked and there is no "accept all", so declining
 *   takes exactly as much effort as accepting (none).
 * - The footer links the privacy notice (s.23), which is also where consent is withdrawn.
 *
 * Switches are native <input type="checkbox" role="switch">: keyboard, form submission and
 * screen-reader state ("on/off") come from the platform.
 */

export type ConsentBasis = "necessary" | "consent";

export type ConsentPurpose = {
	id: string;
	title: string;
	description: string;
	basis: ConsentBasis;
};

type ConsentPanelProps = {
	purposes: readonly ConsentPurpose[];
	/** Granted state per consent purpose id; a missing id means not granted. */
	value: Readonly<Record<string, boolean>>;
	onChange: (id: string, granted: boolean) => void;
	/** Privacy notice, which is also where consent is withdrawn. */
	policyHref?: string;
	/** Version of the privacy notice this consent is given under, e.g. "1.0 (1 ต.ค. 2569)". */
	policyVersion: string;
	title?: React.ReactNode;
	headingLevel?: 2 | 3;
	/** Inside a <form>: each switch submits `${namePrefix}${id}=granted` when on. */
	namePrefix?: string;
	disabled?: boolean;
	className?: string;
};

function ConsentPanel({
	purposes,
	value,
	onChange,
	policyHref = "/privacy",
	policyVersion,
	title = "การใช้ข้อมูลของคุณ",
	headingLevel = 2,
	namePrefix,
	disabled = false,
	className,
}: ConsentPanelProps) {
	const headingId = React.useId();
	const Heading = headingLevel === 2 ? "h2" : "h3";
	const SubHeading = headingLevel === 2 ? "h3" : "h4";
	const necessary = purposes.filter((purpose) => purpose.basis === "necessary");
	const optional = purposes.filter((purpose) => purpose.basis === "consent");

	return (
		<section
			aria-labelledby={headingId}
			data-slot="ds-consent-panel"
			data-policy-version={policyVersion}
			className={cn(
				"flex flex-col gap-5 rounded-md border-2 border-line bg-surface-raised p-4 sm:p-5",
				className,
			)}
		>
			<div className="flex flex-col gap-1">
				<Heading id={headingId} className="type-title text-ink">
					{title}
				</Heading>
				<p className="type-body-sm text-ink-muted">
					เราใช้ข้อมูลเท่าที่จำเป็น และขอความยินยอมแยกทีละเรื่อง คุณเลือกได้อย่างอิสระ
				</p>
			</div>

			{necessary.length > 0 ? (
				<div>
					<SubHeading className="type-label text-ink-muted">ใช้เพื่อให้บริการ</SubHeading>
					<ul className="mt-2 flex flex-col divide-y divide-line">
						{necessary.map((purpose) => (
							<li key={purpose.id} className="flex flex-col gap-2 py-3 last:pb-0">
								<div className="flex flex-wrap items-center justify-between gap-2">
									<p className="type-body font-semibold text-ink">{purpose.title}</p>
									<StatusBadge tone="neutral" icon={<IconLock stroke={2.25} />}>
										จำเป็นต่อการให้บริการ
									</StatusBadge>
								</div>
								<p className="type-body-sm text-ink-muted">{purpose.description}</p>
							</li>
						))}
					</ul>
				</div>
			) : null}

			{optional.length > 0 ? (
				<fieldset className="m-0 min-w-0 border-0 p-0" disabled={disabled}>
					<legend className="type-label p-0 text-ink-muted">
						ขอความยินยอม (เลือกได้ · ค่าเริ่มต้นคือไม่ยินยอม)
					</legend>
					<ul className="mt-2 flex flex-col divide-y divide-line">
						{optional.map((purpose) => (
							<ConsentSwitch
								key={purpose.id}
								purpose={purpose}
								checked={value[purpose.id] === true}
								onChange={onChange}
								name={namePrefix === undefined ? undefined : `${namePrefix}${purpose.id}`}
							/>
						))}
					</ul>
				</fieldset>
			) : null}

			<p className="type-body-sm border-t border-line pt-4 text-ink-muted">
				การให้ความยินยอมเป็นทางเลือกของคุณ ไม่ยินยอมก็ยังเล่นแบบทดสอบและดูผลลัพธ์ได้ตามปกติ
				ถอนความยินยอมได้จากแท็บนี้ที่หน้า{" "}
				<Link
					href={policyHref}
					className="focus-ring rounded-xs font-semibold text-brand underline decoration-2 underline-offset-4 hover:decoration-4"
				>
					ประกาศความเป็นส่วนตัว
				</Link>{" "}
				(ฉบับ {policyVersion})
			</p>
		</section>
	);
}

type ConsentSwitchProps = {
	purpose: ConsentPurpose;
	checked: boolean;
	onChange: (id: string, granted: boolean) => void;
	name?: string;
};

function ConsentSwitch({ purpose, checked, onChange, name }: ConsentSwitchProps) {
	const inputId = React.useId();
	const descriptionId = `${inputId}-description`;

	return (
		<li className="flex items-start justify-between gap-4 py-3 last:pb-0">
			<div className="flex min-w-0 flex-1 flex-col gap-1">
				<label htmlFor={inputId} className="type-body cursor-pointer font-semibold text-ink">
					{purpose.title}
				</label>
				<p id={descriptionId} className="type-body-sm text-ink-muted">
					{purpose.description}
				</p>
			</div>
			<div className="flex w-20 shrink-0 flex-col items-center gap-1">
				{/* 44×64 hit area around a 32×56 visual switch */}
				<span className="relative inline-flex h-11 w-16 items-center justify-center">
					<input
						id={inputId}
						type="checkbox"
						role="switch"
						name={name}
						value="granted"
						checked={checked}
						onChange={(event) => onChange(purpose.id, event.currentTarget.checked)}
						aria-describedby={descriptionId}
						className="peer absolute inset-0 z-10 m-0 cursor-pointer appearance-none opacity-0 disabled:cursor-not-allowed"
					/>
					<span
						aria-hidden
						className={cn(
							"pointer-events-none h-8 w-14 rounded-pill border-2 border-line-strong bg-surface-sunken",
							"transition-colors duration-(--dur-quick) ease-settle motion-reduce:transition-none",
							"peer-checked:border-brand peer-checked:bg-brand",
							"peer-focus-visible:shadow-[0_0_0_2px_var(--surface),0_0_0_4px_var(--focus)]",
							"peer-disabled:opacity-50",
						)}
					/>
					<span
						aria-hidden
						className={cn(
							"pointer-events-none absolute top-1/2 left-2 size-6 -translate-y-1/2 rounded-full bg-ink-muted",
							"transition-[translate,background-color] duration-(--dur-quick) ease-settle motion-reduce:transition-none",
							"peer-checked:translate-x-6 peer-checked:bg-on-brand",
							"peer-disabled:opacity-50",
							"forced-colors:bg-[color:CanvasText] forced-colors:forced-color-adjust-none",
						)}
					/>
				</span>
				<span
					aria-hidden
					className={cn("type-label whitespace-nowrap text-center", checked ? "text-ink" : "text-ink-muted")}
				>
					{checked ? "ยินยอม" : "ไม่ยินยอม"}
				</span>
			</div>
		</li>
	);
}

export { ConsentPanel, type ConsentPanelProps };
