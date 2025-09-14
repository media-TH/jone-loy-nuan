"use client";

import { useActionState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadQuestionImages } from "@/lib/actions/images";
import { SubmitButton } from "@/components/submit-button";
import { useEffect } from "react";

interface ImageUploadFormProps {
	questionId: string;
}

export function ImageUploadForm({ questionId }: ImageUploadFormProps) {
	const [state, formAction] = useActionState(uploadQuestionImages, null);

	useEffect(() => {
		if (state?.success) {
			toast.success("Images uploaded successfully!");
			// Reset state to prevent toast from showing on every render
			// This is a common pattern with useActionState
			// but needs careful handling in a real app.
		} else if (state?.error) {
			toast.error(state.error);
		}
	}, [state]);

	return (
		<form action={formAction} className="border-t pt-6">
			<input type="hidden" name="questionId" value={questionId} />
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div className="space-y-2">
					<Label htmlFor="normal_svg">Normal State Image (.svg)</Label>
					<Input id="normal_svg" name="normal_svg" type="file" accept=".svg" />
				</div>
				<div className="space-y-2">
					<Label htmlFor="result_svg">Result State Image (.svg)</Label>
					<Input id="result_svg" name="result_svg" type="file" accept=".svg" />
				</div>
			</div>
			<div className="mt-6 flex justify-end">
				<SubmitButton>Upload Images</SubmitButton>
			</div>
		</form>
	);
}
