"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function uploadQuestionImages(
	previousState: { error?: string; success?: boolean } | null,
	formData: FormData
) {
	const questionId = formData.get("questionId") as string;
	const normalFile = formData.get("normal_svg") as File | null;
	const resultFile = formData.get("result_svg") as File | null;

	if (!questionId) {
		return { error: "Missing Question ID." };
	}
	if (!normalFile?.size && !resultFile?.size) {
		return { error: "Please provide at least one image file." };
	}

	const supabase = await createClient();

	try {
		if (normalFile && normalFile.size > 0) {
			await uploadVariant(supabase, questionId, normalFile, "normal");
		}
		if (resultFile && resultFile.size > 0) {
			await uploadVariant(supabase, questionId, resultFile, "result");
		}
	} catch (e: unknown) {
		const error = e as Error;
		return { error: error.message };
	}

	revalidatePath(`/mgmt-portal/quizzes/${questionId}/images`);
	revalidatePath("/mgmt-portal");
	return { success: true };
}

async function uploadVariant(
	supabase: Awaited<ReturnType<typeof createClient>>,
	questionId: string,
	file: File,
	variant: "normal" | "result"
) {
	const filePath = `${questionId}/${variant}.svg`;

	// 1. Upload file to storage
	const { error: uploadError } = await supabase.storage
		.from("scenario-images")
		.upload(filePath, file, {
			upsert: true,
			contentType: "image/svg+xml",
		});

	if (uploadError) {
		throw new Error(`Storage Error: ${uploadError.message}`);
	}

	// 2. Get public URL
	const { data: urlData } = supabase.storage
		.from("scenario-images")
		.getPublicUrl(filePath);

	// 3. Save URL to database
	const { error: dbError } = await supabase.from("scenario_images").upsert(
		{
			question_id: questionId,
			variant: variant,
			image_url: urlData.publicUrl,
		},
		{ onConflict: "question_id, variant" }
	);

	if (dbError) {
		throw new Error(`Database Error: ${dbError.message}`);
	}
}
