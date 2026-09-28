import type { ReactNode } from "react";
import { RedFlagLayer, type PlacedRedFlag } from "@/components/ds/red-flag-pin";
import { ScanReveal } from "@/components/motion/scan-reveal";
import { cn } from "@/lib/utils";

type ScenarioPanelProps = {
	revealed: boolean;
	scanKey: string;
	placedFlags: readonly PlacedRedFlag[];
	/** Names the panel for screen readers, e.g. "สถานการณ์จำลอง: หน้าจอขอรหัส PIN". */
	label: string;
	children: ReactNode;
	className?: string;
};

/**
 * The ScenarioFrame look for scenarios whose height follows their content (a PIN pad, a chat):
 * the sky "screen" ground turns to the navy "reveal" ground once answered (a colour transition),
 * one Scan Reveal pass per question, and a RedFlagLayer on top for flags with coordinates.
 */
export function ScenarioPanel({
	revealed,
	scanKey,
	placedFlags,
	label,
	children,
	className,
}: ScenarioPanelProps) {
	return (
		<section aria-label={label} className="mx-auto w-full max-w-md">
			<ScanReveal
				scanKey={scanKey}
				className={cn(
					"rounded-lg p-3 transition-[background-color] duration-(--dur-slow) ease-settle sm:p-4",
					revealed ? "bg-navy-800" : "bg-screen-100",
					className,
				)}
			>
				{children}
				<RedFlagLayer flags={placedFlags} show={revealed} />
			</ScanReveal>
		</section>
	);
}
