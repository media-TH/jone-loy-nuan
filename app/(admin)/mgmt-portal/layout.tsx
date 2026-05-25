import { createClient } from "@/utils/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { PageTransition } from "@/components/motion/PageTransition";


export const dynamic = "force-dynamic";

export default async function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <AdminLayoutContent>{children}</AdminLayoutContent>;
}

async function AdminLayoutContent({ children }: { children: React.ReactNode }) {
	// Middleware ตรวจสอบ auth แล้ว แต่เรายังต้องดึง user data มาแสดง
	const supabase = await createClient();
	const { data, error } = await supabase.auth.getUser();

	// This should never happen due to middleware protection, but defensive programming
	if (!data.user || error) {
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
		<SidebarProvider
      className="h-svh overflow-hidden"
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset className="flex flex-col overflow-hidden">
        <SiteHeader />
        <div className="flex-1 overflow-y-auto p-6">
          <PageTransition>{children}</PageTransition>
        </div>
      </SidebarInset>
    </SidebarProvider>
	);
}
