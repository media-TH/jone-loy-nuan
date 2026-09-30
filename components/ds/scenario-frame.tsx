import type { ReactNode } from "react";
import { IconScan } from "@tabler/icons-react";
import { cva } from "class-variance-authority";
import { ScanReveal } from "@/components/motion/scan-reveal";
import { cn } from "@/lib/utils";

/**
 * The phone-screen panel a scenario sits in. "screen" is the sky panel of the
 * illustrations; after answering it turns to the navy "reveal" ground, a plain colour
 * transition (so reduced motion keeps it). The frame is a size container, so pins placed
 * inside (RedFlagLayer) can size their callouts to the space left to the edge.
 */
const scenarioFrameVariants = cva(
	[
		"relative isolate mx-auto aspect-square w-full max-w-md overflow-hidden rounded-lg",
		"transition-[background-color] duration-(--dur-slow) ease-settle",
	],
	{
		variants: {
			tone: {
				screen: "bg-screen-100",
				reveal: "bg-navy-800",
			},
		},
		defaultVariants: {
			tone: "screen",
		},
	},
);

type ScenarioFrameProps = {
	/** "screen" while deciding, "reveal" once the answer is in. */
	tone?: "screen" | "reveal";
	/** Change to replay the Scan Reveal pass (e.g. the question id). */
	scanKey?: string | number;
	/** Optional chip in the top-left corner, e.g. "หลักฐาน". */
	label?: string;
	children: ReactNode;
	className?: string;
};

/** Rounded scenario frame that plays one Scan Reveal pass whenever `scanKey` changes. */
function ScenarioFrame({ tone = "screen", scanKey, label, children, className }: ScenarioFrameProps) {
	return (
		<div
			data-slot="ds-scenario-frame"
			data-tone={tone}
			className={cn(scenarioFrameVariants({ tone }), className)}
		>
			<ScanReveal scanKey={scanKey} className="absolute inset-0 @container">
				{children}
			</ScanReveal>
			{label && (
				<span className="pointer-events-none absolute left-3 top-3 z-20 inline-flex items-center gap-1 rounded-pill bg-surface-raised px-3 py-1 type-label text-ink shadow-raised">
					<IconScan aria-hidden className="size-3.5" stroke={2.25} />
					{label}
				</span>
			)}
		</div>
	);
}

export { ScenarioFrame, scenarioFrameVariants, type ScenarioFrameProps };
