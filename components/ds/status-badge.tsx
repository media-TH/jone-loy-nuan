import * as React from "react";
import { cva } from "class-variance-authority";
import { IconAlertTriangle, IconCheck, IconFlag } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

/**
 * DS StatusBadge — a status is never colour alone: soft tone fill + tone-tinted icon + an ink word.
 * safe = ถูกต้อง / cleared, flag = ธงแดง / risky, caution = ระวัง, neutral = informational.
 * Each tone ships a default icon; pass `icon={null}` to drop it (e.g. when the word is the status).
 */
export type StatusTone = "safe" | "flag" | "caution" | "neutral";

const statusBadgeVariants = cva(
	[
		"inline-flex max-w-full items-center gap-1.5 rounded-pill px-3 py-1",
		"type-label text-ink",
		"[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
	],
	{
		variants: {
			tone: {
				safe: "bg-safe-soft",
				flag: "bg-flag-soft",
				caution: "bg-caution-soft",
				neutral: "bg-surface-sunken",
			},
		},
	},
);

const iconToneClass: Record<StatusTone, string> = {
	safe: "text-safe",
	flag: "text-flag-text",
	caution: "text-caution-text",
	neutral: "text-ink-muted",
};

const defaultIcons: Record<StatusTone, React.ReactNode> = {
	safe: <IconCheck stroke={2.5} />,
	flag: <IconFlag stroke={2.25} />,
	caution: <IconAlertTriangle stroke={2.25} />,
	neutral: null,
};

type StatusBadgeProps = Omit<React.ComponentProps<"span">, "children"> & {
	tone: StatusTone;
	/** Leading icon. Defaults to the tone's icon; `null` renders none. Always decorative. */
	icon?: React.ReactNode;
	children: React.ReactNode;
};

function StatusBadge({ tone, icon, children, className, ...props }: StatusBadgeProps) {
	const glyph = icon === undefined ? defaultIcons[tone] : icon;

	return (
		<span
			data-slot="ds-status-badge"
			data-tone={tone}
			className={cn(statusBadgeVariants({ tone }), className)}
			{...props}
		>
			{glyph ? (
				<span aria-hidden className={cn("inline-flex", iconToneClass[tone])}>
					{glyph}
				</span>
			) : null}
			<span className="min-w-0">{children}</span>
		</span>
	);
}

export { StatusBadge, statusBadgeVariants, type StatusBadgeProps };
