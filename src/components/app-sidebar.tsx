"use client"

import * as React from "react"
import {
  IconHelp,
  IconInnerShadowTop,
} from "@tabler/icons-react"
import Link from "next/link"

import { NavMain } from "@/components/shared/nav-main"
import { Button } from "@/components/ui/button"
import { NavUser } from "@/components/nav-user"
import { useAuth } from "@/contexts/auth-context"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { sidebarConfig } from "@/config/sidebar"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { profile } = useAuth();

  const userRole = profile?.role as keyof typeof sidebarConfig | undefined;
  const navItems = userRole ? sidebarConfig[userRole] : [];

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href={userRole ? `/${userRole}` : "/dashboard"}>
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">DNOFlow</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
        {/* Help menu hanya untuk controller */}
        {userRole === 'controller' && (
          <div className="mt-auto">
            <Button
              variant="ghost"
              className="w-full flex items-center gap-2 justify-start px-3 py-2"
              asChild
            >
              <Link href="/help">
                <IconHelp className="w-5 h-5" />
                <span>Help</span>
              </Link>
            </Button>
          </div>
        )}
      </SidebarContent>
      <SidebarFooter>
        {/* Only show NavUser if profile is loaded (not null/undefined), and not during loading */}
        {typeof profile === 'object' && profile !== null ? (
          <NavUser user={{
            name: profile.full_name || profile.email,
            email: profile.email,
            avatar: profile.full_name ? `/avatars/${profile.full_name.toLowerCase().replace(' ', '-')}.jpg` : "/avatars/default.jpg",
          }} />
        ) : null}
      </SidebarFooter>
    </Sidebar>
  )
}