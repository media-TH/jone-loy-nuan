"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { upsertQuestion } from "@/lib/actions/questions";
import { QuestionWithAnswers } from "@/lib/types";
import { AnswerFields } from "@/components/admin/answer-fields";

interface QuizUpsertFormProps {
	initialData?: Partial<QuestionWithAnswers> | null;
}

// Submit Button Component with useFormStatus
function SubmitButton({ initialData }: { initialData?: any }) {
	const { pending } = useFormStatus();
	return (
		<Button type="submit" disabled={pending}>
			{pending ? (
				<>
					<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
					{initialData?.id ? "กำลังอัพเดต..." : "กำลังสร้าง..."}
				</>
			) : (
				initialData?.id ? "บันทึกการเปลี่ยนแปลง" : "สร้างคำถาม"
			)}
		</Button>
	);
}

export function QuizUpsertForm({ initialData }: QuizUpsertFormProps) {
	const router = useRouter();
	const [answers, setAnswers] = useState<any[]>([]);
	const formRef = useRef<HTMLFormElement>(null);

	// Simple initial answers parsing
	const initialAnswers = initialData?.answers ? 
		(Array.isArray(initialData.answers) ? initialData.answers.map((answer: any) => ({
			id: answer.id || crypto.randomUUID(),
			text: answer.text || answer.answer_text || "",
			isCorrect: answer.isCorrect ?? answer.is_correct ?? false
		})) : []) : [];

	// Handle form submission with better error handling
	const handleSubmit = async (formData: FormData) => {
		try {
			const result = await upsertQuestion(null, formData);
			if (result?.error) {
				toast.error(result.error);
			} else if (result?.success) {
				toast.success("คำถามบันทึกเรียบร้อยแล้ว!");
				// Refresh และ redirect after successful save
				router.refresh();
				router.push("/mgmt-portal/quizzes");
			}
		} catch (error) {
			toast.error("เกิดข้อผิดพลาด: " + (error as Error).message);
		}
	};

	return (
		<div className="space-y-6">
			<form ref={formRef} action={handleSubmit} className="space-y-6">
				{/* Question Details Card */}
				<Card>
					<CardHeader>
						<CardTitle>
							{initialData?.id ? "แก้ไขคำถาม" : "สร้างคำถามใหม่"}
						</CardTitle>
						<CardDescription>
							{initialData?.id
								? "แก้ไขข้อมูลคำถามและคำตอบ"
								: "เพิ่มคำถามและคำตอบใหม่ลงในระบบ"}
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						{initialData?.id && (
							<input type="hidden" name="id" value={initialData.id} />
						)}

						{/* Question Text */}
						<div className="space-y-2">
							<Label htmlFor="question_text">
								คำถาม <span className="text-red-500">*</span>
							</Label>
							<Textarea
								id="question_text"
								name="question_text"
								defaultValue={initialData?.question_text ?? ""}
								placeholder="กรอกคำถามสำหรับ Quiz..."
								rows={3}
								required
							/>
						</div>

						{/* Category */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="category">หมวดหมู่</Label>
								<Input
									id="category"
									name="category"
									defaultValue={initialData?.category ?? ""}
									placeholder="เช่น การหลอกลวงออนไลน์"
								/>
							</div>

							{/* Order Index */}
							<div className="space-y-2">
								<Label htmlFor="order_index">
									ลำดับคำถาม <span className="text-red-500">*</span>
								</Label>
								<Input
									id="order_index"
									name="order_index"
									type="number"
									min="1"
									defaultValue={initialData?.order_index ?? ""}
									placeholder="1"
									required
								/>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Answers Management */}
				<AnswerFields 
					initialAnswers={initialAnswers}
					onChange={setAnswers}
				/>

				{/* Action Buttons */}
				<Card>
					<CardContent className="pt-6">
						<div className="flex justify-end gap-3">
							<Button 
								type="button" 
								variant="outline" 
								onClick={() => router.back()}
							>
								ยกเลิก
							</Button>
							<SubmitButton initialData={initialData} />
						</div>
					</CardContent>
				</Card>
			</form>
		</div>
	);
}
