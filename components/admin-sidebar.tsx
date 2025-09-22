"use client";

import * as React from "react";
import {
	IconDashboard,
	IconChartBar,
	IconListDetails,
	IconSettings,
	IconUsers,
	IconFileDescription,
	IconBook,
	IconPlus,
} from "@tabler/icons-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
} from "@/components/ui/sidebar";

const data = {
	user: {
		name: "Admin",
		email: "admin@example.com",
		avatar: "/avatars/admin.jpg",
	},
	navMain: [
		{
			title: "Dashboard",
			url: "/mgmt-portal",
			icon: IconDashboard,
		},
		{
			title: "Analytics",
			url: "/mgmt-portal/analytics",
			icon: IconChartBar,
		},
		{
			title: "Quiz Management",
			url: "/mgmt-portal/quizzes",
			icon: IconListDetails,
		},
		{
			title: "Create Quiz",
			url: "/mgmt-portal/quizzes/new",
			icon: IconPlus,
		},
		{
			title: "Settings",
			url: "/mgmt-portal/settings",
			icon: IconSettings,
		},
	],
};

export function AdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton size="lg" asChild>
							<a href="/mgmt-portal">
								<div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
									<IconBook className="size-4" />
								</div>
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-semibold">
										Scam Awareness
									</span>
									<span className="truncate text-xs">Admin Portal</span>
								</div>
							</a>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={data.navMain} />
			</SidebarContent>
			<SidebarFooter>
				<NavUser user={data.user} />
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
