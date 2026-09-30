"use client";

import * as React from "react";
import * as RadioGroup from "@radix-ui/react-radio-group";
import { IconCheck } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

/**
 * DS ChoiceChips — single choice shown as tappable chips (age band, education, …).
 * Built on Radix RadioGroup: role="radiogroup"/"radio", roving focus, arrow keys move and
 * select, and a native radio is submitted with `name` inside a <form>.
 * Selected = brand fill + check icon + weight, so it never relies on colour alone.
 */

export type ChoiceOption = {
	value: string;
	label: string;
};

const columnClass = {
	1: "grid-cols-1",
	2: "grid-cols-2",
	3: "grid-cols-3",
	4: "grid-cols-4",
} as const;

type ChoiceChipsLabelling =
	| { ariaLabel: string; "aria-labelledby"?: string }
	| { ariaLabel?: string; "aria-labelledby": string };

type ChoiceChipsProps = ChoiceChipsLabelling & {
	name: string;
	options: readonly ChoiceOption[];
	/** Selected value; `null` or "" = nothing chosen yet. */
	value: string | null;
	onValueChange: (value: string) => void;
	/** Grid columns on phones and up. Default 2. */
	columns?: keyof typeof columnClass;
	id?: string;
	required?: boolean;
	disabled?: boolean;
	className?: string;
	"aria-describedby"?: string;
	"aria-invalid"?: boolean | "true" | "false";
	"aria-required"?: boolean | "true" | "false";
};

function ChoiceChips({
	name,
	options,
	value,
	onValueChange,
	ariaLabel,
	columns = 2,
	className,
	...props
}: ChoiceChipsProps) {
	return (
		<RadioGroup.Root
			data-slot="ds-choice-chips"
			name={name}
			value={value ?? ""}
			onValueChange={onValueChange}
			aria-label={ariaLabel}
			className={cn("group/chips grid gap-2", columnClass[columns], className)}
			{...props}
		>
			{options.map((option) => (
				<RadioGroup.Item
					key={option.value}
					value={option.value}
					className={cn(
						"inline-flex min-h-11 w-full min-w-0 items-center justify-center gap-1.5 rounded-pill border-2 px-4 py-2",
						"type-body text-center font-medium",
						"border-line-strong bg-surface-raised text-ink",
						"transition-colors duration-(--dur-quick) ease-settle motion-reduce:transition-none",
						"hover:data-[state=unchecked]:bg-brand-soft",
						"data-[state=checked]:border-brand data-[state=checked]:bg-brand data-[state=checked]:font-semibold data-[state=checked]:text-on-brand",
						"group-aria-invalid/chips:data-[state=unchecked]:border-flag",
						"focus-ring disabled:cursor-not-allowed disabled:opacity-50",
					)}
				>
					<RadioGroup.Indicator className="inline-flex shrink-0">
						<IconCheck aria-hidden stroke={2.75} className="size-4" />
					</RadioGroup.Indicator>
					<span className="min-w-0 text-balance">{option.label}</span>
				</RadioGroup.Item>
			))}
		</RadioGroup.Root>
	);
}

export { ChoiceChips, type ChoiceChipsProps };
