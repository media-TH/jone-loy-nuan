"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useQuizResultStore } from "@/store/quiz-store";
import { RotateCcw, Home } from "lucide-react";
import { useMemo } from "react";
import { getRiskAssessment } from "@/lib/transforms/quiz.transforms";

export default function ResultPage() {
	const router = useRouter();
	const { getSummary, resetQuiz } = useQuizResultStore();
	const { score, total } = getSummary();

	// 🎯 Result design mapping using transform utilities
	const resultDesign = useMemo(() => {
		return getRiskAssessment(score, total);
	}, [score, total]);

	// 🎨 Animation Variants
	const containerVariants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: {
				duration: 0.6,
				staggerChildren: 0.2,
			},
		},
	};

	const itemVariants = {
		hidden: { opacity: 0, y: 30 },
		visible: {
			opacity: 1,
			y: 0,
			transition: { duration: 0.6 },
		},
	};

	// 🔄 Handle Actions
	const handlePlayAgain = () => {
		resetQuiz();
		router.push("/quiz");
	};

	const handleGoHome = () => {
		resetQuiz();
		router.push("/");
	};

	return (
		<motion.div
			className="min-h-[100dvh] bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 flex flex-col justify-center py-6 px-4 sm:py-8 md:py-12"
			variants={containerVariants}
			initial="hidden"
			animate="visible"
		>
			<div className="w-full max-w-md mx-auto flex flex-col justify-center min-h-0">
				{/* 🎴 Main Card (Optimized spacing) */}
				<motion.div variants={itemVariants} className="mb-6 sm:mb-8">
					<Card className="border-2 border-slate-200 bg-white shadow-xl">
						<CardHeader className="pb-3 sm:pb-4 pt-6 sm:pt-8">
							<div className="flex flex-col items-center text-center gap-2 sm:gap-3">
								<span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-indigo-900">
									{resultDesign.scoreLabel}
								</span>
								{"imageSrc" in resultDesign && (
									<Image
										src={resultDesign.imageSrc}
										alt={resultDesign.imageAlt}
										width={200}
										height={200}
										className="w-48 h-48 sm:w-56 sm:h-56 rounded-xl object-contain"
										priority={false}
									/>
								)}
								<CardTitle className="mt-1 sm:mt-2 text-lg sm:text-xl font-bold text-rose-600 px-2">
									{resultDesign.title}
								</CardTitle>
							</div>
						</CardHeader>
						<CardContent className="pt-0 pb-6 sm:pb-8">
							<div className="rounded-2xl border bg-blue-50 border-blue-200 p-4 sm:p-5">
								<ul className="list-disc marker:text-blue-900 pl-4 sm:pl-5 space-y-2 sm:space-y-2.5 text-slate-800">
									{resultDesign.tips.map((tip, index) => (
										<motion.li
											key={index}
											initial={{ opacity: 0, x: -20 }}
											animate={{ opacity: 1, x: 0 }}
											transition={{ delay: 0.4 + index * 0.12 }}
											className="text-sm sm:text-base leading-relaxed"
										>
											{tip}
										</motion.li>
									))}
								</ul>
							</div>
						</CardContent>
					</Card>
				</motion.div>

				{/* 🎮 Actions (Fixed positioning) */}
				<motion.div
					variants={itemVariants}
					className="flex flex-col gap-3 sm:gap-4 mt-auto"
				>
					<Button
						onClick={handlePlayAgain}
						className="w-full h-12 sm:h-14 text-base sm:text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
					>
						<RotateCcw className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
						เล่นใหม่
					</Button>
					<Button
						onClick={handleGoHome}
						className="w-full h-12 sm:h-14 text-base sm:text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
					>
						<Home className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
						กลับหน้าแรก
					</Button>
				</motion.div>
			</div>
		</motion.div>
	);
}
