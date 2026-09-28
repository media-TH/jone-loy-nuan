"use client";

import Image, { getImageProps } from "next/image";
import { preload } from "react-dom";
import { RedFlagLayer } from "@/components/ds/red-flag-pin";
import { ScenarioFrame } from "@/components/ds/scenario-frame";
import type { ScenarioViewProps } from "@/components/quiz/types";
import type { ImagePairScenario } from "@/lib/content/types";
import { cn } from "@/lib/utils";

/** The frame is at most 28rem wide and, on short phones, capped by the viewport height. */
const FRAME_SIZE = "max-w-[min(28rem,46svh)]";
const IMAGE_SIZES = "(min-width: 30rem) 28rem, calc(100vw - 2rem)";

/** Crossfade between the two illustrations: an opacity transition, so reduced motion keeps it. */
const LAYER = "object-contain transition-opacity duration-(--dur-slow) ease-settle";

/**
 * The scene as first seen, then (once answered) the same scene with its red flags drawn in,
 * crossfaded on the navy "reveal" ground. Pins with coordinates plant on top (Flag Plant).
 */
export function ImagePairScenarioView({
	scenario,
	revealed,
	scanKey,
	placedFlags,
	priority = false,
}: ScenarioViewProps<ImagePairScenario>) {
	return (
		<ScenarioFrame tone={revealed ? "reveal" : "screen"} scanKey={scanKey} className={FRAME_SIZE}>
			<Image
				src={scenario.normalSrc}
				alt={revealed ? "" : scenario.alt}
				aria-hidden={revealed || undefined}
				fill
				sizes={IMAGE_SIZES}
				preload={priority}
				className={cn(LAYER, revealed && "opacity-0")}
			/>
			{/* Loaded with the question (not lazily) so the reveal never waits on the network. */}
			<Image
				src={scenario.resultSrc}
				alt={revealed ? `เฉลย: ${scenario.alt}` : ""}
				aria-hidden={!revealed || undefined}
				fill
				sizes={IMAGE_SIZES}
				loading="eager"
				className={cn(LAYER, !revealed && "opacity-0")}
			/>
			<RedFlagLayer flags={placedFlags} show={revealed} />
		</ScenarioFrame>
	);
}

/** Warms the browser cache with both illustrations (the exact srcset next/image will request). */
export function preloadImagePair(scenario: ImagePairScenario): void {
	for (const src of [scenario.normalSrc, scenario.resultSrc]) {
		const { props } = getImageProps({ src, alt: "", fill: true, sizes: IMAGE_SIZES });
		preload(props.src, {
			as: "image",
			imageSrcSet: props.srcSet,
			imageSizes: props.sizes,
			fetchPriority: "low",
		});
	}
}
