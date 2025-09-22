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
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
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
			<header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b">
				<div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
					<div className="text-center">
						<p className="text-gray-600">กำลังโหลด...</p>
					</div>
				</div>
			</header>
		);
	}

	return (
		<header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
			<div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
				<SidebarTrigger className="-ml-1" />
				<Separator
					orientation="vertical"
					className="mx-2 data-[orientation=vertical]:h-4"
				/>
				<h1 className="text-base font-medium">Admin Portal</h1>
				<div className="ml-auto flex items-center gap-2">
					<Button variant="ghost" asChild size="sm" className="hidden sm:flex">
						<Link href="/mgmt-portal/analytics">
							<BarChart3 className="mr-2 h-4 w-4" />
							Analytics
						</Link>
					</Button>
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
		</header>
	);
}
