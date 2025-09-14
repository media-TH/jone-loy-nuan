"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { uploadQuestionImages } from "@/lib/actions/images";
import { useRouter } from "next/navigation";

interface SvgUploadDialogProps {
	scenarioId: string;
	onClose: () => void;
	open: boolean;
}

export function SvgUploadDialog({
	open,
	onClose,
	scenarioId,
}: SvgUploadDialogProps) {
	const [normalFile, setNormalFile] = useState<File | null>(null);
	const [resultFile, setResultFile] = useState<File | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const router = useRouter();

	const handleFileChange = (
		e: ChangeEvent<HTMLInputElement>,
		variant: "normal" | "result"
	) => {
		const file = e.target.files?.[0] || null;
		if (variant === "normal") {
			setNormalFile(file);
		} else {
			setResultFile(file);
		}
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		if (!normalFile && !resultFile) {
			toast.error("Please select at least one file to upload.");
			return;
		}

		setIsUploading(true);
		try {
			// ใช้ uploadQuestionImages แทน
			const formData = new FormData();
			formData.append("questionId", scenarioId);
			if (normalFile) formData.append("normal_svg", normalFile);
			if (resultFile) formData.append("result_svg", resultFile);

			const result = await uploadQuestionImages(null, formData);

			if (result?.error) {
				throw new Error(result.error);
			}

			toast.success("Images uploaded successfully!");
			router.refresh();
			onClose();
		} catch (err: unknown) {
			const error = err as Error;
			console.error("Upload error:", error);
			toast.error(`Upload failed: ${error.message}`);
		} finally {
			setIsUploading(false);
		}
	};
	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent>
				<form onSubmit={handleSubmit}>
					<DialogHeader>
						<DialogTitle>Upload Images for Scenario {scenarioId}</DialogTitle>
						<DialogDescription>
							Upload normal and result SVG images for this question.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="normal-file">Normal State Image (SVG)</Label>
							<Input
								id="normal-file"
								type="file"
								accept=".svg"
								onChange={(e) => handleFileChange(e, "normal")}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="result-file">Result State Image (SVG)</Label>
							<Input
								id="result-file"
								type="file"
								accept=".svg"
								onChange={(e) => handleFileChange(e, "result")}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={onClose}
							disabled={isUploading}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={(!normalFile && !resultFile) || isUploading}
						>
							{isUploading ? "Uploading..." : "Upload Images"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
