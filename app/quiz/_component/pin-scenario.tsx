"use client";
import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { usePinScenarioAnimations } from "@/hooks/usePinScenarioAnimations";

// Type definitions
interface OTPSlotProps {
	value: string;
	isActive: boolean;
	index: number;
	onClick: () => void;
	hasError?: boolean;
}

interface NumberPadButtonProps {
	value?: string;
	onClick?: () => void;
	disabled?: boolean;
	variant?: "number" | "backspace" | "empty";
}

interface IntegratedPinScenarioProps {
	onAnswer?: (isCorrect: boolean) => void;
	disabled?: boolean;
}

/**
 * OTP Input Slot Component - shadcn/ui style with enhanced features
 */
const OTPSlot = ({
	value,
	isActive,
	index,
	onClick,
	hasError = false,
}: OTPSlotProps) => {
	return (
		<motion.div
			whileTap={{ scale: 0.95 }}
			onClick={onClick}
			className={`
        relative flex items-center justify-center
        h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14
        text-lg sm:text-xl font-semibold
        bg-white border-2 rounded-lg
        transition-all duration-200 ease-in-out cursor-pointer
        ${
					isActive
						? "border-blue-500 ring-2 ring-blue-100 shadow-sm"
						: value
						? "border-gray-400"
						: "border-gray-300 hover:border-gray-400"
				}
        ${hasError ? "border-red-500 bg-red-50" : ""}
        ${value ? "text-gray-900" : "text-gray-400"}
      `}
			role="textbox"
			aria-label={`PIN digit ${index + 1}`}
			aria-describedby="pin-instructions"
		>
			<span className={value ? "block" : "hidden"}>{value ? "•" : ""}</span>
			{isActive && !value && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					className="absolute inset-0 flex items-center justify-center"
				>
					<div className="w-0.5 h-5 sm:h-6 md:h-7 bg-blue-500 rounded-full animate-blink" />
				</motion.div>
			)}
		</motion.div>
	);
};

/**
 * Number Pad Button Component
 */
const NumberPadButton = ({
	value = "",
	onClick,
	disabled = false,
	variant = "number",
}: NumberPadButtonProps) => {
	if (variant === "empty") {
		return <div className="h-12 sm:h-14 md:h-16" />;
	}

	const Icon =
		variant === "backspace" ? (
			<svg
				className="w-6 h-6"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
				strokeWidth={2}
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z"
				/>
			</svg>
		) : (
			<span className="text-xl sm:text-2xl font-medium">{value}</span>
		);

	return (
		<motion.button
			whileTap={{ scale: 0.92 }}
			whileHover={{ scale: 1.02 }}
			onClick={onClick}
			disabled={disabled}
			className={`
        h-12 sm:h-14 md:h-16 bg-white flex items-center justify-center
        rounded-xl border border-gray-200
        hover:bg-gray-50 hover:border-gray-300
        active:bg-gray-100
        disabled:opacity-40 disabled:cursor-not-allowed
        text-gray-700
        transition-all duration-150
        shadow-sm hover:shadow
      `}
			aria-label={
				variant === "backspace" ? "Delete last digit" : `Enter digit ${value}`
			}
		>
			{Icon}
		</motion.button>
	);
};

/**
 * Main PIN Scenario Component with Integrated OTP Input
 */
export default function IntegratedPinScenario({
	onAnswer = (isCorrect: boolean) => console.log("Answer:", isCorrect),
	disabled = false,
}: IntegratedPinScenarioProps) {
	const [value, setValue] = useState("");
	const [answered, setAnswered] = useState(false);
	const [activeIndex, setActiveIndex] = useState(0);
	const [hasError, setHasError] = useState(false);
	const maxLength = 6;
	const inputRef = useRef<HTMLDivElement>(null);

	// Use animation hook
	const {
		redFlagVariants,
		noteVariants,
		overlayVariants,
		containerVariants,
		buttonsVariants,
		showRedFlag,
		showNote,
		showOverlay,
	} = usePinScenarioAnimations(answered);

	// Auto-focus management
	useEffect(() => {
		setActiveIndex(Math.min(value.length, maxLength - 1));
	}, [value]);

	// Handle number pad press
	const handleNumberPress = (num: string) => {
		if (disabled || answered || value.length >= maxLength) return;

		const newValue = value + num;
		setValue(newValue);
		setHasError(false);

		// Auto-submit when complete
		if (newValue.length === maxLength) {
			setTimeout(() => {
				// You can add auto-verification logic here
			}, 100);
		}
	};

	// Handle backspace
	const handleBackspace = () => {
		if (disabled || answered) return;
		setValue((prev) => prev.slice(0, -1));
		setHasError(false);
	};

	// Handle slot click
	const handleSlotClick = (index: number) => {
		if (disabled || answered) return;
		setActiveIndex(index);
		// Focus management for accessibility
		if (inputRef.current) {
			inputRef.current.focus();
		}
	};

	// Handle cancel (Correct answer in quiz context)
	const handleCancel = () => {
		if (disabled) return;
		console.log("[DEBUG] PIN Scenario - handleCancel called, sending onAnswer(true)");
		setAnswered(true);
		onAnswer(true);
	};

	// Handle confirm (Incorrect answer in quiz context)
	const handleConfirm = () => {
		if (disabled) return;

		// Validate PIN (example validation)
		if (value.length !== maxLength) {
			setHasError(true);
			// Shake animation
			setTimeout(() => setHasError(false), 500);
			return;
		}

		setAnswered(true);
		onAnswer(false);
	};

	// Handle keyboard input
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (disabled || answered) return;

		if (e.key >= "0" && e.key <= "9") {
			handleNumberPress(e.key);
		} else if (e.key === "Backspace") {
			handleBackspace();
		} else if (e.key === "Enter" && value.length === maxLength) {
			handleConfirm();
		}
	};

	// Number pad layout
	const numberPadLayout = [
		["1", "2", "3"],
		["4", "5", "6"],
		["7", "8", "9"],
		["empty", "0", "backspace"],
	];

	return (
		<motion.div
			className="relative w-full max-w-xs sm:max-w-sm md:max-w-md mx-auto p-2 sm:p-4"
			onKeyDown={handleKeyDown}
			tabIndex={0}
			ref={inputRef}
			variants={containerVariants}
			initial="initial"
			animate="animate"
		>
			{/* Overlay when answered - exclude red flag area */}
			{showOverlay && (
				<motion.div
					className="absolute inset-0 z-10 bg-black/20 rounded-2xl pointer-events-none"
					variants={overlayVariants}
					initial="hidden"
					animate="visible"
				/>
			)}

			{/* Main Container */}
			<motion.div
				initial={{ y: 20, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				className="w-full bg-gradient-to-b from-gray-50 to-white rounded-2xl shadow-lg overflow-hidden border border-gray-200"
			>
				{/* Header */}
				<div className="text-center pt-4 sm:pt-6 md:pt-8 pb-4 sm:pb-6 px-4 sm:px-6 bg-white">
					{/* Red Flag and Note are now handled by RedFlagOverlay component */}

					<motion.h3
						initial={{ scale: 0.9 }}
						animate={{ scale: 1 }}
						className="text-lg sm:text-xl font-semibold text-gray-800 mb-2"
					>
						กรุณากรอกรหัสผ่าน
					</motion.h3>
					<p id="pin-instructions" className="text-xs sm:text-sm text-gray-500">
						ป้อนรหัส PIN 6 หลักเพื่อดำเนินการต่อ
					</p>
				</div>

				{/* OTP Input Slots */}
				<div className="flex justify-center items-center gap-1 px-2 sm:px-4 md:px-6 pb-4 sm:pb-6 md:pb-8 bg-white">
					{[0, 1, 2, 3, 4, 5].map((index) => (
						<OTPSlot
							key={index}
							value={value[index] || ""}
							isActive={index === activeIndex}
							index={index}
							onClick={() => handleSlotClick(index)}
							hasError={hasError}
						/>
					))}
				</div>

				{/* Number Pad */}
				<div className="bg-gray-50 px-2 sm:px-4 pb-4 sm:pb-6 pt-2">
					<div className="grid grid-cols-3 gap-1 sm:gap-2">
						{numberPadLayout.flat().map((item, index) => {
							if (item === "empty") {
								return <NumberPadButton key={index} variant="empty" value="" />;
							}

							if (item === "backspace") {
								return (
									<NumberPadButton
										key={index}
										variant="backspace"
										value=""
										onClick={handleBackspace}
										disabled={disabled || answered || value.length === 0}
									/>
								);
							}

							return (
								<NumberPadButton
									key={index}
									value={item}
									onClick={() => handleNumberPress(item)}
									disabled={disabled || answered || value.length >= maxLength}
								/>
							);
						})}
					</div>
				</div>
			</motion.div>

			{/* Action Buttons */}
			<motion.div
				className="flex gap-2 sm:gap-3 mt-4 sm:mt-6"
				variants={buttonsVariants}
				initial="initial"
				animate="animate"
			>
				<motion.button
					whileHover={{ scale: 1.02 }}
					whileTap={{ scale: 0.98 }}
					onClick={handleCancel}
					disabled={disabled || answered}
					className="
            flex-1 h-10 sm:h-12 text-sm sm:text-base
            bg-white text-gray-700 
            border-2 border-gray-300 rounded-xl
            hover:bg-gray-50 hover:border-gray-400
            active:bg-gray-100
            font-medium
            transition-all duration-150
            shadow-sm hover:shadow
            disabled:opacity-50 disabled:cursor-not-allowed
          "
				>
					ไม่กรอกรหัส
				</motion.button>
				<motion.button
					whileHover={{ scale: 1.02 }}
					whileTap={{ scale: 0.98 }}
					onClick={handleConfirm}
					disabled={disabled || answered}
					className={`
            flex-1 h-10 sm:h-12 text-sm sm:text-base
            bg-gradient-to-r from-gray-800 to-gray-700 text-white 
            border-2 border-gray-800 rounded-xl
            hover:from-gray-700 hover:to-gray-600
            active:from-gray-900 active:to-gray-800
            font-medium
            transition-all duration-150
            shadow-md hover:shadow-lg
            disabled:opacity-50 disabled:cursor-not-allowed
            ${
							value.length === maxLength
								? "ring-2 ring-blue-400 ring-opacity-50"
								: ""
						}
          `}
				>
					ยืนยัน
				</motion.button>
			</motion.div>

			<style jsx>{`
				@keyframes blink {
					0%,
					50% {
						opacity: 1;
					}
					51%,
					100% {
						opacity: 0;
					}
				}

				.animate-blink {
					animation: blink 1s infinite;
				}
			`}</style>
		</motion.div>
	);
}
