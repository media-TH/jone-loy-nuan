"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface AdminErrorBoundaryProps {
	children: React.ReactNode;
	fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

interface AdminErrorFallbackProps {
	error: Error;
	resetError: () => void;
}

function AdminErrorFallback({ error, resetError }: AdminErrorFallbackProps) {
	return (
		<div className="flex items-center justify-center min-h-[400px]">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
						<AlertTriangle className="h-6 w-6 text-red-600" />
					</div>
					<CardTitle className="text-red-900">เกิดข้อผิดพลาด</CardTitle>
				</CardHeader>
				<CardContent className="text-center space-y-4">
					<p className="text-sm text-gray-600">
						ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง
					</p>
					{process.env.NODE_ENV === "development" && (
						<details className="text-left bg-gray-50 p-3 rounded text-xs">
							<summary className="cursor-pointer font-medium">
								รายละเอียด Error
							</summary>
							<pre className="mt-2 whitespace-pre-wrap text-red-800">
								{error.message}
								{error.stack && (
									<>
										{"\n\n"}
										{error.stack}
									</>
								)}
							</pre>
						</details>
					)}
					<Button onClick={resetError} className="w-full">
						<RefreshCw className="mr-2 h-4 w-4" />
						ลองใหม่
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}

export class AdminErrorBoundary extends React.Component<
	AdminErrorBoundaryProps,
	{ hasError: boolean; error: Error | null }
> {
	constructor(props: AdminErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error) {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error("Admin dashboard error:", error, errorInfo);
	}

	render() {
		if (this.state.hasError) {
			const FallbackComponent = this.props.fallback || AdminErrorFallback;

			return (
				<FallbackComponent
					error={this.state.error!}
					resetError={() => {
						this.setState({ hasError: false, error: null });
					}}
				/>
			);
		}

		return this.props.children;
	}
}
