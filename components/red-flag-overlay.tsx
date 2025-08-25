"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePinScenarioAnimations } from "@/hooks/usePinScenarioAnimations";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import Image from "next/image";

interface RedFlagOverlayProps {
	show: boolean;
	questionOrderIndex?: number;
}

export function RedFlagOverlay({ show, questionOrderIndex = 1 }: RedFlagOverlayProps) {
	const [mounted, setMounted] = useState(false);
	const { redFlagVariants, noteVariants } = usePinScenarioAnimations(show);

	useEffect(() => {
		setMounted(true);
	}, []);

	// Only show for question 1 (PIN scenario)
	if (questionOrderIndex !== 1 || !mounted) {
		return null;
	}

	const overlayContent = (
		<AnimatePresence>
			{show && (
				<div className="fixed inset-0 z-[9999] pointer-events-none">
					{/* Red Flag Pin */}
					<motion.div
						className="absolute top-[10%] left-1/2 transform -translate-x-1/2 pointer-events-none"
						variants={redFlagVariants}
						initial="hidden"
						animate="visible"
						exit="hidden"
						style={{ opacity: 1 }}
					>
						<div className="relative" style={{ opacity: 1 }}>
							<Image
								src="/images/scenarios/question-1/redflag-pin.svg"
								alt="Red flag pin warning"
								className="w-64 h-auto transform scale-150"
								style={{ opacity: 1 }}
								width={256}
								height={256}
							/>
						</div>
					</motion.div>

					{/* Note Text */}
					<motion.div
						className="absolute top-[15%] left-0 right-0 px-4 pointer-events-none"
						variants={noteVariants}
						initial="hidden"
						animate="visible"
						exit="hidden"
						style={{ opacity: 1 }} 
					>
						<div 
							className="w-full text-sm text-white text-center rounded-lg px-3 py-2 mx-auto max-w-sm"
							style={{ opacity: 1 }}
						>
							*แบบทดสอบนี้ไม่มีการจัดเก็บรหัสผ่านของผู้ใช้
						</div>
					</motion.div>
				</div>
			)}
		</AnimatePresence>
	);

	// Use portal to render outside the normal component tree
	// This ensures it won't inherit any parent opacity styles
	return createPortal(overlayContent, document.body);
}