"use client"

import * as React from "react"
import {
  IconChartBar,
  IconDashboard,
  IconListDetails,
  IconSettings,
  IconBook,
  IconPlus,
  IconInnerShadowTop,
} from "@tabler/icons-react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "Admin",
    email: "admin@สแกนโจร.online",
    avatar: "/avatars/admin.jpg",
  },
  navMain: [
    {
      title: "แดชบอร์ด",
      url: "/mgmt-portal",
      icon: IconDashboard,
    },
    {
      title: "รายงานผล",
      url: "/mgmt-portal/analytics",
      icon: IconChartBar,
    },
    {
      title: "จัดการคำถาม",
      url: "/mgmt-portal/quizzes",
      icon: IconListDetails,
    },
    {
      title: "สร้างคำถามใหม่",
      url: "/mgmt-portal/quizzes/new",
      icon: IconPlus,
    },
    {
      title: "ตั้งค่า",
      url: "/mgmt-portal/settings",
      icon: IconSettings,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/mgmt-portal">
                <IconBook className="!size-5" />
                <span className="text-base font-semibold">สแกนโจร.online</span>
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
    </Sidebar>
  )
}
