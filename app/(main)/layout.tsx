import type { ReactNode } from "react";
import { ScanTransitionProvider } from "@/components/motion/scan-transition";

export default function MainLayout({ children }: { children: ReactNode }) {
	return <ScanTransitionProvider>{children}</ScanTransitionProvider>;
}
