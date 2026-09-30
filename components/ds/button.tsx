import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * DS Button — "Scan & Flag".
 * spark = the ONE primary action per view (yellow with an ink key-ledge).
 * brand = secondary action. quiet = tertiary. flag = destructive (e.g. delete my data).
 * Hover lift / press compress are CSS transitions (micro-interactions), not motion/react.
 */
const buttonVariants = cva(
	[
		"relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap",
		"font-display font-semibold tracking-[0.01em]",
		"transition-[transform,box-shadow,background-color,color] duration-(--dur-quick) ease-settle",
		"focus-ring disabled:pointer-events-none disabled:opacity-50",
		"motion-reduce:transition-colors motion-reduce:transform-none",
		"[&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
	],
	{
		variants: {
			variant: {
				spark: [
					"bg-spark text-on-spark shadow-[0_3px_0_var(--ledge)]",
					"hover:-translate-y-0.5 hover:shadow-[0_5px_0_var(--ledge)]",
					"active:translate-y-0.5 active:shadow-[0_1px_0_var(--ledge)]",
				],
				brand: [
					"bg-brand text-on-brand shadow-[0_3px_0_var(--ledge)]",
					"hover:-translate-y-0.5 hover:shadow-[0_5px_0_var(--ledge)]",
					"active:translate-y-0.5 active:shadow-[0_1px_0_var(--ledge)]",
				],
				quiet: [
					"bg-surface-raised text-ink border-2 border-line-strong",
					"hover:bg-brand-soft active:translate-y-px",
				],
				flag: [
					"bg-flag text-on-flag shadow-[0_3px_0_var(--ledge)]",
					"hover:-translate-y-0.5 hover:shadow-[0_5px_0_var(--ledge)]",
					"active:translate-y-0.5 active:shadow-[0_1px_0_var(--ledge)]",
				],
				link: "text-brand underline underline-offset-4 decoration-2 hover:decoration-4 px-0",
			},
			size: {
				md: "h-12 min-w-12 rounded-pill px-6 text-base",
				lg: "h-14 min-w-14 rounded-pill px-8 text-lg",
				icon: "size-12 rounded-pill",
			},
			block: {
				true: "w-full",
				false: "",
			},
		},
		defaultVariants: {
			variant: "spark",
			size: "md",
			block: false,
		},
	},
);

type ButtonProps = React.ComponentProps<"button"> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean;
	};

function Button({ className, variant, size, block, asChild = false, ...props }: ButtonProps) {
	const Comp = asChild ? Slot : "button";
	return (
		<Comp
			data-slot="ds-button"
			className={cn(buttonVariants({ variant, size, block }), className)}
			{...props}
		/>
	);
}

export { Button, buttonVariants, type ButtonProps };
