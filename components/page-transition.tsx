"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";

const PageTransition = ({ children }: { children: React.ReactNode }) => {
	const pathname = usePathname();
	const [isReady, setIsReady] = useState(false);
	const [showOverlay, setShowOverlay] = useState(true);

	const [prevPathname, setPrevPathname] = useState(pathname);

	if (pathname !== prevPathname) {
		setPrevPathname(pathname);
		setIsReady(false);
		setShowOverlay(true);
	}

	useEffect(() => {
		// ถ้าเป็นหน้าแรก ให้รอ landing animation จบก่อน
		const isHomePage = pathname === "/";
		const delay = isHomePage ? 0 : 1000; // หน้าแรกไม่ delay, หน้าอื่นรอ 1 วินาที

		const timer = setTimeout(() => {
			setShowOverlay(false);
			// รอให้ overlay fade out จบก่อนแสดง content
			setTimeout(() => {
				setIsReady(true);
			}, 1000);
		}, delay);

		return () => clearTimeout(timer);
	}, [pathname]);

	return (
		<>
			<AnimatePresence mode="wait">
				{showOverlay && (
					<motion.div
						key={pathname}
						initial={{ opacity: 1 }}
						animate={{
							opacity: 0,
							transition: { duration: 0.5, ease: "easeInOut" },
						}}
						exit={{ opacity: 0 }}
						className="h-screen w-screen fixed bg-gradient-to-br from-pink-50/80 via-rose-50/80 to-pink-100/80 top-0 pointer-events-none z-40"
					/>
				)}
			</AnimatePresence>

			{/* Loading state แทน children ทันที */}
			{!isReady ? (
				<div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
					<motion.div
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.3 }}
						className="text-center"
					>
						<div className="w-8 h-8 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin mx-auto mb-4"></div>
						<p className="text-pink-600 text-sm">กำลังโหลด...</p>
					</motion.div>
				</div>
			) : (
				children
			)}
		</>
	);
};

export default PageTransition;
