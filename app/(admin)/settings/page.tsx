import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Database, Users, Shield } from "lucide-react";

export default function AdminSettingsPage() {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold text-gray-900">ตั้งค่าระบบ</h1>
				<p className="text-gray-600">จัดการการตั้งค่าและกำหนดค่าของระบบ CMS</p>
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center">
							<Database className="mr-2 h-5 w-5" />
							การตั้งค่าฐานข้อมูล
						</CardTitle>
						<CardDescription>
							จัดการการเชื่อมต่อและการตั้งค่าฐานข้อมูล Supabase
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						<div className="flex items-center justify-between">
							<span className="text-sm font-medium">สถานะการเชื่อมต่อ</span>
							<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
								เชื่อมต่อแล้ว
							</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-sm font-medium">จำนวนคำถาม</span>
							<span className="text-sm text-gray-600">-- รายการ</span>
						</div>
						<Button variant="outline" className="w-full" disabled>
							ตรวจสอบการเชื่อมต่อ
						</Button>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center">
							<Users className="mr-2 h-5 w-5" />
							การจัดการผู้ใช้
						</CardTitle>
						<CardDescription>
							จัดการสิทธิ์และบทบาทของผู้ดูแลระบบ
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						<div className="flex items-center justify-between">
							<span className="text-sm font-medium">ผู้ดูแลระบบ</span>
							<span className="text-sm text-gray-600">1 คน</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-sm font-medium">สิทธิ์การเข้าถึง</span>
							<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
								Admin
							</span>
						</div>
						<Button variant="outline" className="w-full" disabled>
							จัดการผู้ใช้
						</Button>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center">
							<Shield className="mr-2 h-5 w-5" />
							ความปลอดภัย
						</CardTitle>
						<CardDescription>
							การตั้งค่าความปลอดภัยและการรักษาความปลอดภัย
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						<div className="flex items-center justify-between">
							<span className="text-sm font-medium">การป้องกันเส้นทาง</span>
							<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
								เปิดใช้งาน
							</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-sm font-medium">การยืนยันตัวตน</span>
							<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
								Supabase Auth
							</span>
						</div>
						<Button variant="outline" className="w-full" disabled>
							ตั้งค่าความปลอดภัย
						</Button>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center">
							<Settings className="mr-2 h-5 w-5" />
							การตั้งค่าทั่วไป
						</CardTitle>
						<CardDescription>
							การตั้งค่าพื้นฐานของระบบ CMS
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						<div className="flex items-center justify-between">
							<span className="text-sm font-medium">ภาษาระบบ</span>
							<span className="text-sm text-gray-600">ไทย (TH)</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-sm font-medium">โซนเวลา</span>
							<span className="text-sm text-gray-600">Asia/Bangkok</span>
						</div>
						<Button variant="outline" className="w-full" disabled>
							แก้ไขการตั้งค่า
						</Button>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>ข้อมูลระบบ</CardTitle>
					<CardDescription>
						ข้อมูลเกี่ยวกับเวอร์ชันและสถานะของระบบ
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="text-center p-4 bg-gray-50 rounded-lg">
							<div className="text-2xl font-bold text-gray-900">v1.0.0</div>
							<div className="text-sm text-gray-600">เวอร์ชันระบบ</div>
						</div>
						<div className="text-center p-4 bg-gray-50 rounded-lg">
							<div className="text-2xl font-bold text-green-600">Online</div>
							<div className="text-sm text-gray-600">สถานะระบบ</div>
						</div>
						<div className="text-center p-4 bg-gray-50 rounded-lg">
							<div className="text-2xl font-bold text-gray-900">99.9%</div>
							<div className="text-sm text-gray-600">Uptime</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}