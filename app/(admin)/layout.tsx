import { createClient } from "@/utils/supabase/server";
import { AdminHeader } from "@/components/admin-header";
import { debugSession } from "@/utils/debug-session";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <AdminLayoutContent>{children}</AdminLayoutContent>;
}

async function AdminLayoutContent({ children }: { children: React.ReactNode }) {
	// Debug session information
	await debugSession();

	// Middleware ตรวจสอบ auth แล้ว แต่เรายังต้องดึง user data มาแสดง
	const supabase = await createClient();

	try {
		// Get both session and user data for better reliability
		const { data: { session }, error: sessionError } = await supabase.auth.getSession();
		const { data: { user }, error: userError } = await supabase.auth.getUser();

		// This should never happen due to middleware protection, but defensive programming
		if (!session || !user || sessionError || userError) {
			console.error("Admin layout: No valid session or user", { sessionError, userError });
			return (
				<div className="min-h-screen bg-gray-50 flex items-center justify-center">
					<div className="text-center">
						<h1 className="text-2xl font-bold text-gray-900 mb-4">
							ไม่สามารถเข้าถึงได้
						</h1>
						<p className="text-gray-600 mb-6">กรุณาเข้าสู่ระบบเพื่อเข้าถึงหน้านี้</p>
						<a
							href="/login"
							className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
						>
							เข้าสู่ระบบ
						</a>
					</div>
				</div>
			);
		}



		return (
			<div className="min-h-screen bg-gray-50">
				<AdminHeader user={user} />
				<main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">{children}</main>
			</div>
		);
	} catch (error) {
		console.error("Admin layout error:", error);
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-gray-900 mb-4">
						เกิดข้อผิดพลาด
					</h1>
					<p className="text-gray-600 mb-6">ไม่สามารถโหลดข้อมูลผู้ใช้ได้</p>
					<a
						href="/login"
						className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
					>
						เข้าสู่ระบบใหม่
					</a>
				</div>
			</div>
		);
	}
}
