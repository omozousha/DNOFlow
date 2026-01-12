
"use client"

import * as React from "react"

import {
	IconCreditCard,
	IconDotsVertical,
	IconLogout,
	IconNotification,
	IconUserCircle,
} from "@tabler/icons-react"

import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@/components/ui/avatar"
import { useContext } from "react"
import { AccountDialogContext } from "@/components/layout/dashboard-layout"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/auth-context"

export function NavUser({ user }: {
	user: {
		full_name?: string
		email?: string
		avatar_url?: string
		role?: string
	}
}) {
	// ...existing code...
	return null // placeholder, isi dengan kode NavUser asli
}
