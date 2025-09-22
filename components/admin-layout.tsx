"use client";

import { ReactNode } from "react";
import { AdminHeader } from "@/components/admin-header";
import { AdminErrorBoundary } from "@/components/admin-error-boundary";

interface AdminLayoutProps {
	children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
	return (
		<AdminErrorBoundary>
			<div className="min-h-screen bg-gray-50">
				<AdminHeader user={{ email: "admin@example.com" } as any} />
				<main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
					{children}
				</main>
			</div>
		</AdminErrorBoundary>
	);
}
