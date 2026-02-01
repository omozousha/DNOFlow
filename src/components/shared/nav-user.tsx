"use client"

import * as React from "react"

import { NavUser as BaseNavUser } from "@/components/nav-user"

export function NavUser({
	user,
}: {
	user: {
		full_name?: string
		email?: string
		avatar_url?: string
		role?: string
	}
}) {
	const name = user.full_name || user.email || "User"
	const email = user.email || ""
	const avatar = user.avatar_url || ""

	return <BaseNavUser user={{ name, email, avatar }} />
}
