"use client";

import { EvidenceText } from "@/components/ds/evidence-text";
import { ScenarioPanel } from "@/components/quiz/scenario-panel";
import type { ScenarioViewProps } from "@/components/quiz/types";
import type {
	CallScenario,
	ChatApp,
	ChatScenario,
	SmsScenario,
} from "@/lib/content/types";
import { cn } from "@/lib/utils";

/** Scenario kinds that are typed in the content model but have no dedicated renderer yet. */
export type PlaceholderScenario = ChatScenario | CallScenario | SmsScenario;

const CHAT_APP_LABEL: Record<ChatApp, string> = {
	line: "LINE",
	messenger: "Messenger",
	sms: "SMS",
};

function kindLabel(scenario: PlaceholderScenario): string {
	switch (scenario.kind) {
		case "chat":
			return `แชท ${CHAT_APP_LABEL[scenario.app]}`;
		case "call":
			return "สายโทรเข้า";
		case "sms":
			return "ข้อความ SMS";
	}
}

/** 105 → "1:45" */
function formatDuration(seconds: number): string {
	const whole = Math.max(0, Math.floor(seconds));
	return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

function PlaceholderBody({ scenario }: { scenario: PlaceholderScenario }) {
	switch (scenario.kind) {
		case "call":
			return (
				<div className="flex flex-col items-center gap-1 py-4 text-center">
					<p className="type-title text-ink">{scenario.caller}</p>
					<EvidenceText as="p" text={scenario.number} className="text-ink-muted" />
					{scenario.duration !== undefined && (
						<p className="type-body-sm text-ink-muted">
							คุยมาแล้ว <span className="tabular-nums">{formatDuration(scenario.duration)}</span>
						</p>
					)}
				</div>
			);
		case "sms":
			return (
				<div className="flex flex-col gap-2">
					<p className="type-body-sm text-ink-muted">
						จาก <EvidenceText text={scenario.sender} className="text-ink" />
					</p>
					<p className="whitespace-pre-line rounded-md bg-surface-sunken p-3 type-body text-ink">
						{scenario.body}
					</p>
				</div>
			);
		case "chat":
			return (
				<ol role="list" aria-label="ข้อความในแชท" className="flex flex-col gap-2">
					{scenario.messages.map((message, index) => (
						<li
							key={index}
							className={cn(
								"max-w-[85%] whitespace-pre-line rounded-md px-3 py-2 type-body text-ink",
								message.from === "me" ? "self-end bg-brand-soft" : "self-start bg-surface-sunken",
							)}
						>
							<span className="sr-only">{message.from === "me" ? "คุณ: " : "อีกฝ่าย: "}</span>
							{message.text}
						</li>
					))}
				</ol>
			);
	}
}

/**
 * Stand-in for scenario kinds without a renderer yet: the scenario's own text on the scenario
 * ground, so a question authored ahead of its renderer is still playable. Evidence highlights
 * and app chrome belong to the dedicated renderers.
 */
export function PlaceholderScenarioView({
	scenario,
	revealed,
	scanKey,
	placedFlags,
}: ScenarioViewProps<PlaceholderScenario>) {
	const label = kindLabel(scenario);
	return (
		<ScenarioPanel
			revealed={revealed}
			scanKey={scanKey}
			placedFlags={placedFlags}
			label={`สถานการณ์จำลอง: ${label}`}
		>
			<div className="flex flex-col gap-3 rounded-md bg-surface-raised p-4 text-ink shadow-raised">
				<p className="type-label text-ink-muted">{label}</p>
				<PlaceholderBody scenario={scenario} />
			</div>
		</ScenarioPanel>
	);
}
