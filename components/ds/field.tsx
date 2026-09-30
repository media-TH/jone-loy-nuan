import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { IconAlertCircle, IconChevronDown } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

/**
 * DS Field — label, helper, error and one control, wired for assistive tech.
 *
 * Order follows the GOV.UK pattern (label → helper → error → control) so the hint and the
 * error stay visible above the on-screen keyboard on phones. The control receives `id`,
 * `aria-describedby` (helper + error), `aria-invalid` and `aria-required`, either merged onto a
 * single child element or handed to a render function:
 *
 *   <Field label="อาชีพ" helper="ไม่บังคับ"><FieldSelect name="occupation">…</FieldSelect></Field>
 *   <Field label="ช่วงอายุ" controlType="group">{(control) => <ChoiceChips {...control} … />}</Field>
 *
 * Give the id to Field (not the control) so the label and descriptions point at it.
 */

/** Props a Field hands to its control. Spread them onto the control element. */
export type FieldControlProps = {
	id: string;
	"aria-describedby"?: string;
	"aria-invalid"?: true;
	"aria-required"?: true;
	/** Only for `controlType="group"`: a group has no native <label>, so it is labelled by id. */
	"aria-labelledby"?: string;
};

export type FieldIds = {
	controlId: string;
	labelId: string;
	helperId?: string;
	errorId?: string;
};

type FieldProps = {
	/** Id for the control; generated when omitted. */
	id?: string;
	label: React.ReactNode;
	helper?: React.ReactNode;
	/** Shown when present and marks the control invalid. */
	error?: React.ReactNode;
	required?: boolean;
	/**
	 * "native" (default): input/select/textarea, labelled by a <label for>.
	 * "group": a composite control such as ChoiceChips (radiogroup), labelled via aria-labelledby.
	 */
	controlType?: "native" | "group";
	className?: string;
	children: React.ReactElement | ((control: FieldControlProps, ids: FieldIds) => React.ReactNode);
};

function Field({
	id,
	label,
	helper,
	error,
	required = false,
	controlType = "native",
	className,
	children,
}: FieldProps) {
	const generatedId = React.useId();
	const controlId = id ?? `${generatedId}-control`;
	const labelId = `${controlId}-label`;
	const helperId = helper ? `${controlId}-helper` : undefined;
	const errorId = error ? `${controlId}-error` : undefined;
	const describedBy = [errorId, helperId].filter(Boolean).join(" ") || undefined;
	const isGroup = controlType === "group";

	const control: FieldControlProps = {
		id: controlId,
		"aria-describedby": describedBy,
		"aria-invalid": error ? true : undefined,
		"aria-required": required ? true : undefined,
		"aria-labelledby": isGroup ? labelId : undefined,
	};

	const labelContent = (
		<>
			{label}
			{required ? (
				<span aria-hidden className="font-normal text-ink-muted">
					{" "}
					(จำเป็น)
				</span>
			) : null}
		</>
	);
	const labelClass = "type-body-sm font-semibold text-ink";

	return (
		<div data-slot="ds-field" className={cn("flex flex-col gap-2", className)}>
			{isGroup ? (
				<span id={labelId} className={labelClass}>
					{labelContent}
				</span>
			) : (
				<label id={labelId} htmlFor={controlId} className={labelClass}>
					{labelContent}
				</label>
			)}
			{helper ? (
				<p id={helperId} className="type-body-sm -mt-1 text-ink-muted">
					{helper}
				</p>
			) : null}
			{error ? (
				<p id={errorId} className="type-body-sm flex items-start gap-1.5 font-semibold text-flag-text">
					<IconAlertCircle aria-hidden stroke={2.25} className="mt-0.5 size-[1.125rem] shrink-0" />
					<span>
						<span className="sr-only">ข้อผิดพลาด: </span>
						{error}
					</span>
				</p>
			) : null}
			{typeof children === "function" ? (
				children(control, { controlId, labelId, helperId, errorId })
			) : (
				<Slot {...control}>{children}</Slot>
			)}
		</div>
	);
}

const controlBase = [
	"h-12 w-full min-w-0 rounded-sm border-2 border-line-strong bg-surface-raised px-4",
	"type-body text-ink",
	"transition-[border-color,box-shadow] duration-(--dur-quick) ease-settle motion-reduce:transition-none",
	"focus-ring focus-visible:border-brand",
	"aria-invalid:border-flag",
	"disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:opacity-60",
];

type FieldInputProps = React.ComponentProps<"input">;

/** Text-like input styled for Field. React 19: `ref` is a regular prop. */
function FieldInput({ className, type = "text", ...props }: FieldInputProps) {
	return (
		<input
			data-slot="ds-field-input"
			type={type}
			className={cn(controlBase, "placeholder:text-ink-muted", className)}
			{...props}
		/>
	);
}

type FieldSelectProps = React.ComponentProps<"select"> & {
	/** Adds a first, empty option ("not chosen") with this text. It stays selectable. */
	placeholder?: string;
};

/** Native <select> styled for Field — the most reliable picker on phones and for screen readers. */
function FieldSelect({ className, placeholder, children, ...props }: FieldSelectProps) {
	return (
		<div data-slot="ds-field-select" className="relative w-full">
			<select
				className={cn(
					controlBase,
					"cursor-pointer appearance-none pr-12",
					"has-[option[value='']:checked]:text-ink-muted [&_option]:text-ink",
					className,
				)}
				{...props}
			>
				{placeholder !== undefined ? <option value="">{placeholder}</option> : null}
				{children}
			</select>
			<IconChevronDown
				aria-hidden
				stroke={2.25}
				className="pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2 text-ink-muted"
			/>
		</div>
	);
}

export { Field, FieldInput, FieldSelect, type FieldProps, type FieldInputProps, type FieldSelectProps };
