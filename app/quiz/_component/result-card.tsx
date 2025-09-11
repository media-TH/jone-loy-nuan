"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useQuizAnimations } from "@/hooks/useQuizAnimations";
import { useState } from "react";

interface ResultCardProps {
	showResult: boolean;
	isCorrect: boolean | null;
	result: {
		correctTitle: string;
		wrongTitle: string;
		header: string;
		explanation: string;
	};
	onReset: () => void;
	isLoading?: boolean;
	isLastQuestion?: boolean;
}

export const ResultCard = ({
	showResult,
	isCorrect,
	result,
	onReset,
	isLoading = false,
	isLastQuestion = false,
}: ResultCardProps) => {
	const { getResultCardAnimation } = useQuizAnimations(showResult);
	const resultAnimation = getResultCardAnimation();

	// Security & Animation State Management
	const [isButtonLoading, setIsButtonLoading] = useState(false);
	const [animationState, setAnimationState] = useState<"idle" | "loading">(
		"idle"
	);
	const [isButtonHovered, setIsButtonHovered] = useState(false);
	const [rippleEffect, setRippleEffect] = useState(false);

	// Security: Validate navigation permissions
	const canProceed = showResult && !isLoading && !isButtonLoading;
	const isValidState = showResult && result;

	// Enhanced next button handler with security and animation
	const handleNextClick = async () => {
		// Security: Prevent unauthorized navigation
		if (!canProceed || !isValidState) {
			return;
		}

		try {
			setIsButtonLoading(true);
			setAnimationState("loading");

			// Add ripple effect for better UX
			setRippleEffect(true);
			setTimeout(() => setRippleEffect(false), 300);

			// Blinking animation for visual feedback
			await new Promise((resolve) => setTimeout(resolve, 800));

			setAnimationState("loading");

			// Additional processing time
			await new Promise((resolve) => setTimeout(resolve, 400));

			// Reset animation state and proceed
			setAnimationState("idle");
			setIsButtonLoading(false);
			onReset(); // จะไปหน้าผลลัพธ์ถ้าเป็นข้อสุดท้าย หรือข้อถัดไปถ้าไม่ใช่
		} catch (error) {
			console.error("Navigation error:", error);
			setAnimationState("idle");
			setIsButtonLoading(false);
		}
	};

	const getTitle = () => {
		console.log("[DEBUG] ResultCard - isCorrect:", isCorrect);
		return isCorrect ? result.correctTitle : result.wrongTitle;
	};

	// Enhanced button styling with better gradients and animations
	const getButtonStyles = () => {
		const baseStyles =
			"absolute top-4 right-4 z-10 overflow-hidden flex items-center justify-center w-14 h-14 rounded-full transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-opacity-50 transform-gpu";

		if (!canProceed || isButtonLoading) {
			return `${baseStyles} bg-gradient-to-br from-gray-300 to-gray-400 cursor-not-allowed opacity-60 focus:ring-gray-300`;
		}

		if (isLastQuestion) {
			return `${baseStyles} bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg hover:shadow-xl focus:ring-emerald-300 cursor-pointer ${
				isButtonHovered ? "scale-105 shadow-2xl" : ""
			}`;
		}

		return `${baseStyles} bg-gradient-to-br from-[#FFD633] to-[#FFCF00] hover:from-[#FFCF00] hover:to-[#FFC700] shadow-lg hover:shadow-xl focus:ring-yellow-300 cursor-pointer ${
			isButtonHovered ? "scale-105 shadow-2xl" : ""
		}`;
	};

	return (
		<AnimatePresence>
			{showResult && (
				<motion.div
					{...resultAnimation.overlay}
					className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
				>
					<div className="relative w-full md:max-w-md mx-auto">
						{/* Enhanced Navigation Button with Premium Styling */}
						{isValidState && (
							<motion.button
								onClick={handleNextClick}
								disabled={!canProceed || isButtonLoading}
								className={getButtonStyles()}
								onMouseEnter={() => setIsButtonHovered(true)}
								onMouseLeave={() => setIsButtonHovered(false)}
								whileHover={canProceed ? { scale: 1.05 } : {}}
								whileTap={canProceed ? { scale: 0.95 } : {}}
								initial={{ opacity: 0, y: -20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.3, delay: 0.5 }}
								aria-label={
									isButtonLoading
										? "กำลังโหลด..."
										: isLastQuestion
										? "ดูผลลัพธ์"
										: "ไปข้อถัดไป"
								}
								type="button"
							>
								{/* Ripple Effect */}
								<AnimatePresence>
									{rippleEffect && (
										<motion.div
											className="absolute inset-0 bg-white rounded-full opacity-30"
											initial={{ scale: 0 }}
											animate={{ scale: 2 }}
											exit={{ opacity: 0 }}
											transition={{ duration: 0.3 }}
										/>
									)}
								</AnimatePresence>

								{/* Button Content with Enhanced Animations */}
								<AnimatePresence mode="wait">
									{animationState === "loading" ? (
										<motion.div
											key="loading"
											initial={{ opacity: 0, scale: 0.5 }}
											animate={{ opacity: 1, scale: 1 }}
											exit={{ opacity: 0, scale: 0.5 }}
											transition={{ duration: 0.2 }}
											className="relative"
										>
											<div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
											{/* Loading dots animation */}
											<div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-1">
												{[0, 1, 2].map((i) => (
													<motion.div
														key={i}
														className="w-1 h-1 bg-white rounded-full"
														animate={{ opacity: [0.3, 1, 0.3] }}
														transition={{
															duration: 1,
															repeat: Infinity,
															delay: i * 0.2,
														}}
													/>
												))}
											</div>
										</motion.div>
									) : isLastQuestion ? (
										<motion.div
											key="check"
											initial={{ opacity: 0, scale: 0.5 }}
											animate={{
												opacity: 1,
												scale: isButtonHovered ? 1.1 : 1,
												rotate: isButtonHovered ? [0, -10, 10, 0] : 0,
											}}
											transition={{ duration: 0.3 }}
											className="relative"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												className="h-7 w-7 text-white drop-shadow-sm"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
												strokeWidth={2.5}
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													d="M13 5l7 7-7 7M6 5l7 7-7 7"
												/>
											</svg>
											{/* Success sparkle effect */}
											{isButtonHovered && (
												<motion.div
													className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full opacity-60"
													animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
													transition={{ duration: 0.6, repeat: Infinity }}
												/>
											)}
										</motion.div>
									) : (
										<motion.div
											key="arrow"
											initial={{ opacity: 0, scale: 0.5 }}
											animate={{
												opacity: 1,
												scale: isButtonHovered ? 1.1 : 1,
												x: isButtonHovered ? 2 : 0,
											}}
											transition={{ duration: 0.3 }}
											className="relative"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												className="h-7 w-7 text-[#003A70] drop-shadow-sm"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
												strokeWidth={2.5}
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													d="M9 5l7 7-7 7"
												/>
											</svg>
											{/* Hover arrow trail effect */}
											{isButtonHovered && (
												<motion.svg
													xmlns="http://www.w3.org/2000/svg"
													className="absolute top-0 left-0 h-7 w-7 text-[#003A70] opacity-30"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
													strokeWidth={2.5}
													initial={{ x: -8, opacity: 0 }}
													animate={{ x: 0, opacity: 0.3 }}
													transition={{ duration: 0.3 }}
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														d="M9 5l7 7-7 7"
													/>
												</motion.svg>
											)}
										</motion.div>
									)}
								</AnimatePresence>

								{/* Progress indicator for better UX */}
								{canProceed && (
									<motion.div
										className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-white rounded-full opacity-60"
										initial={{ scaleX: 0 }}
										animate={{ scaleX: isButtonHovered ? 1 : 0 }}
										transition={{ duration: 0.3 }}
									/>
								)}
							</motion.button>
						)}

						{/* Enhanced Result Card with Better Styling */}
						<motion.div
							{...resultAnimation.card}
							className="relative bg-gradient-to-br from-white to-gray-50 rounded-t-3xl shadow-2xl border border-gray-100 overflow-hidden"
						>
							{/* Decorative top border */}
							<div
								className={`h-1 bg-gradient-to-r ${
									isCorrect
										? "from-emerald-400 to-emerald-500"
										: "from-rose-400 to-rose-500"
								}`}
							/>

							<div className="p-6 md:p-8 pt-8">
								<motion.div {...resultAnimation.title}>
									<div className="flex items-start gap-4 mb-6">
										<div className="flex-1 text-center">
											{/* Enhanced title with better typography */}
											<motion.h2
												className="text-xl font-bold text-[#054877] mb-2"
												initial={{ opacity: 0, y: 10 }}
												animate={{ opacity: 1, y: 0 }}
												transition={{ delay: 0.2 }}
											>
												{getTitle()}
											</motion.h2>

											{/* Enhanced header with gradient text */}
											<motion.p
												className="text-3xl font-bold bg-gradient-to-r from-[#fa4198] to-[#e91e63] bg-clip-text text-transparent"
												initial={{ opacity: 0, scale: 0.9 }}
												animate={{ opacity: 1, scale: 1 }}
												transition={{ delay: 0.3 }}
											>
												{result.header}
											</motion.p>
										</div>
									</div>
								</motion.div>

								{/* Enhanced explanation box */}
								<motion.div
									{...resultAnimation.content}
									className="relative bg-gradient-to-br from-[#c3d3e0] to-[#b8cdd9] rounded-xl p-6 text-sm text-[#0b4979] leading-relaxed shadow-inner border border-[#a8c2d0]"
								>
									{/* Decorative corner accent */}
									<div className="absolute top-0 left-0 w-12 h-12 bg-gradient-to-br from-white/20 to-transparent rounded-br-full" />

									<div className="relative z-10 text-justify">{result.explanation}</div>
								</motion.div>

								{/* Security: Hide sensitive data during loading with enhanced styling */}
								<motion.div
									className={`h-4 md:h-6 transition-opacity duration-300 ${
										isButtonLoading ? "opacity-50" : ""
									}`}
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									transition={{ delay: 0.8 }}
								/>
							</div>

							{/* Subtle bottom gradient for depth */}
							<div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-100/50 to-transparent pointer-events-none" />
						</motion.div>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
};
