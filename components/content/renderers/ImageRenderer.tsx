"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useQuizAnimations } from "@/hooks/useQuizAnimations";
import type { QuestionWithAnswers } from "@/lib/types";

interface ImageRendererProps {
	questionData: QuestionWithAnswers;
	showResult: boolean;
	variant?: "fullscreen" | "preview";
}

/**
 * Image Renderer - Handles image-based question content
 * Supports normal/result image transitions with animations
 */
export function ImageRenderer({ 
    questionData, 
    showResult, 
    variant = "fullscreen" 
}: ImageRendererProps) {
    const { getContentMotionProps } = useQuizAnimations(showResult);
	
	const normalImageUrl = questionData.normal_image_url;
	const resultImageUrl = questionData.result_image_url;

	// No images available
	if (!normalImageUrl && !resultImageUrl) {
		return (
			<div className="w-full h-full flex items-center justify-center">
				<div className="text-center text-gray-500">
					<p>ไม่มีรูปภาพสำหรับคำถามนี้</p>
				</div>
			</div>
		);
	}

    // Avoid nested scale animations: freeze wrapper scale at 1 and let images cross-fade only
    const baseMotion = getContentMotionProps();
    const wrapperMotion = {
        initial: baseMotion.initial,
        animate: { ...(baseMotion as any).animate, scale: 1 },
        transition: (baseMotion as any).transition,
    };

    return (
        <div className="w-full h-full flex items-center justify-center">
            <motion.div
                className="relative w-full max-w-md aspect-square"
                {...wrapperMotion}
            >
				{/* Normal State Image */}
				{normalImageUrl && (
                    <motion.div
                        className="absolute inset-0"
                        animate={{ opacity: showResult ? 0 : 1 }}
                        transition={{ duration: 0.4 }}
                    >
						<Image
							src={normalImageUrl}
							alt="Normal state"
							fill
							className="object-contain"
							priority
						/>
					</motion.div>
				)}

				{/* Result State Image */}
                {resultImageUrl && showResult && (
                    <motion.div
                        className="absolute inset-0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                    >
						<Image
							src={resultImageUrl}
							alt="Result state"
							fill
							className="object-contain"
							priority
						/>
					</motion.div>
				)}
			</motion.div>
		</div>
	);
}
