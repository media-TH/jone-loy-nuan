"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, Settings, BarChart3 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { logout } from "@/app/(main)/login/action";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface AdminHeaderProps {
	user: SupabaseUser;
}

export function AdminHeader({ user: initialUser }: AdminHeaderProps) {
	const [user, setUser] = useState<SupabaseUser | null>(initialUser);
	const router = useRouter();

	useEffect(() => {
		const supabase = createClient();

		// Initialize with server-provided user
		setUser(initialUser);

		// Listen for auth changes
		const { data: { subscription } } = supabase.auth.onAuthStateChange(
			(event, session) => {
				setUser(session?.user ?? null);
			}
		);

		return () => subscription.unsubscribe();
	}, [initialUser]);

	const handleLogout = async () => {
		try {
			await logout();
		} catch (error) {
			console.error("Logout error:", error);
		}
	};

	if (!user) {
		return (
			<div className="flex items-center justify-center h-16 bg-white border-b">
				<div className="text-center">
					<p className="text-gray-600">กำลังโหลด...</p>
				</div>
			</div>
		);
	}

	return (
		<header className="bg-white shadow-sm border-b">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between items-center h-16">
					{/* Logo/Brand */}
					<div className="flex items-center">
						<Link href="/mgmt-portal" className="flex items-center">
							<div className="flex-shrink-0">
								<h1 className="text-xl font-bold text-gray-900">
									Admin Portal
								</h1>
							</div>
						</Link>
					</div>

					{/* Navigation */}
					<nav className="hidden md:flex space-x-8">
						<Link
							href="/mgmt-portal"
							className="text-gray-900 hover:text-blue-600 px-3 py-2 text-sm font-medium"
						>
							Dashboard
						</Link>
						<Link
							href="/mgmt-portal/analytics"
							className="text-gray-900 hover:text-blue-600 px-3 py-2 text-sm font-medium"
						>
							Analytics
						</Link>
						<Link
							href="/mgmt-portal/quizzes"
							className="text-gray-900 hover:text-blue-600 px-3 py-2 text-sm font-medium"
						>
							Quizzes
						</Link>
						<Link
							href="/mgmt-portal/settings"
							className="text-gray-900 hover:text-blue-600 px-3 py-2 text-sm font-medium"
						>
							Settings
						</Link>
					</nav>

					{/* User Menu */}
					<div className="flex items-center">
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" className="relative h-8 w-8 rounded-full">
									<User className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent className="w-56" align="end" forceMount>
								<DropdownMenuLabel className="font-normal">
									<div className="flex flex-col space-y-1">
										<p className="text-sm font-medium leading-none">
											{user.email}
										</p>
										<p className="text-xs leading-none text-muted-foreground">
											Administrator
										</p>
									</div>
								</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuItem asChild>
									<Link href="/mgmt-portal/analytics">
										<BarChart3 className="mr-2 h-4 w-4" />
										Analytics
									</Link>
								</DropdownMenuItem>
								<DropdownMenuItem asChild>
									<Link href="/mgmt-portal/settings">
										<Settings className="mr-2 h-4 w-4" />
										Settings
									</Link>
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem onClick={handleLogout}>
									<LogOut className="mr-2 h-4 w-4" />
									Log out
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>
			</div>
		</header>
	);
}
