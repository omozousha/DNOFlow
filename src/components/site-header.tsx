"use client"

import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/shared/theme-toggle"

// Page title mapping
const pageTitles: Record<string, string> = {
  '/controller': 'Dashboard Controller',
  '/controller/worksheet': 'Project Worksheet',
  '/controller/projects': 'Projects Management',
  '/admin': 'Admin Dashboard',
  '/admin/users': 'User Management',
  '/admin/settings': 'Settings',
  '/admin/dashboard': 'Admin Dashboard',
  '/owner/ftth': 'FTTH Dashboard',
  '/owner/backbone': 'Backbone Dashboard',
  '/help': 'Help & Documentation',
}

export function SiteHeader() {
  const pathname = usePathname()
  
  // Get page title based on current pathname
  const getPageTitle = () => {
    // Exact match first
    if (pageTitles[pathname]) {
      return pageTitles[pathname]
    }
    
    // Check for partial matches (for nested routes)
    const matchingKey = Object.keys(pageTitles).find(key => 
      pathname.startsWith(key) && key !== '/'
    )
    
    if (matchingKey) {
      return pageTitles[matchingKey]
    }
    
    // Default fallback
    return 'FTTH Dashboard'
  }

  return (
    <header 
      className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)"
      data-header-id="main-site-header"
    >
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{getPageTitle()}</h1>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
