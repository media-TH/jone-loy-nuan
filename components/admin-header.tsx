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

	return (
		<header className="bg-white shadow-sm border-b sticky top-0 z-50">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between items-center h-16">
					<div className="flex items-center space-x-8">
						<Link href="/mgmt-portal" className="text-xl font-semibold text-gray-900 hover:text-gray-700">
							Quiz Admin Dashboard
						</Link>
						
						<nav className="hidden md:flex space-x-6">
							<Link
								href="/mgmt-portal"
								className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
							>
								Dashboard
							</Link>
							<Link
								href="/mgmt-portal/analytics"
								className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
							>
								Analytics
							</Link>
							<Link
								href="/mgmt-portal/quizzes"
								className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
							>
								Manage Quizzes
							</Link>
						</nav>
					</div>

					<div className="flex items-center space-x-4">
						{user && (
							<div className="text-sm text-gray-600">
								Welcome, {user.email}
							</div>
						)}
						
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="sm" className="relative h-8 w-8 rounded-full">
									<User className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-56">
								<DropdownMenuLabel className="font-normal">
									<div className="flex flex-col space-y-1">
										<p className="text-sm font-medium leading-none">Admin</p>
										<p className="text-xs leading-none text-muted-foreground">
											{user?.email}
										</p>
									</div>
								</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuItem asChild>
									<Link href="/mgmt-portal" className="cursor-pointer">
										<BarChart3 className="mr-2 h-4 w-4" />
										<span>Dashboard</span>
									</Link>
								</DropdownMenuItem>
								<DropdownMenuItem asChild>
									<Link href="/mgmt-portal/settings" className="cursor-pointer">
										<Settings className="mr-2 h-4 w-4" />
										<span>Settings</span>
									</Link>
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem 
									onClick={handleLogout} 
									className="cursor-pointer text-red-600 focus:text-red-600"
								>
									<LogOut className="mr-2 h-4 w-4" />
									<span>Log out</span>
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>
			</div>
		</header>
	);
}