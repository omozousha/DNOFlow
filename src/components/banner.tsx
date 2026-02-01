"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Pattern } from "@/components/ui/pattern"
import { cn } from "@/lib/utils"

interface BannerProps extends React.HTMLAttributes<HTMLDivElement> {
  logoSrc?: string
  logoAlt?: string
}

// Tagline mapping berdasarkan halaman
const pageTaglines: Record<string, string> = {
  '/controller': 'Dashboard Controller - Project Management',
  '/controller/worksheet': 'Project Worksheet - Data Entry',
  '/controller/projects': 'Projects Management - Overview',
  '/admin': 'Admin Dashboard - System Control',
  '/admin/users': 'User Management - Access Control',
  '/admin/settings': 'Settings - Configuration',
  '/admin/dashboard': 'Admin Dashboard - Analytics',
  '/owner/ftth': 'FTTH Dashboard - Network Overview',
  '/owner/backbone': 'Backbone Dashboard - Infrastructure',
  '/help': 'Help & Documentation - Support Center',
}

export function Banner({ 
  className, 
  logoSrc = "/logo_dash4.svg",
  logoAlt = "DNO Flow Logo",
  ...props 
}: BannerProps) {
  const pathname = usePathname()
  
  // Get tagline berdasarkan pathname
  const getTagline = () => {
    // Exact match
    if (pageTaglines[pathname]) {
      return pageTaglines[pathname]
    }
    
    // Partial match untuk nested routes
    const matchingKey = Object.keys(pageTaglines).find(key => 
      pathname.startsWith(key) && key !== '/'
    )
    
    if (matchingKey) {
      return pageTaglines[matchingKey]
    }
    
    // Default
    return 'FTTH Management System'
  }
  return (
    <div 
      className={cn(
        "relative w-full h-20 sm:h-24 overflow-hidden border-b bg-muted/30",
        className
      )} 
      data-slot="banner"
      {...props}
    >
      {/* Background Pattern */}
      <Pattern variant="dots" className="z-[1]" />
      
      {/* Top green solid bar */}
      <div className="absolute top-0 left-0 right-0 h-2 sm:h-3 bg-green-600 shadow-[0_4px_4px_rgba(0,0,0,0.25)] z-30" />
      
      {/* Content container */}
      <div className="relative h-full flex items-center justify-between px-2 sm:px-6 gap-2 sm:gap-4 z-10">
        {/* Logo section with white background and green border */}
        <div className="absolute left-[-23] top-8 -translate-y-1/2 z-20">
          <div className="relative p-1 sm:p-1.5 h-24 sm:h-28 md:h-32 lg:h-36 aspect-square rotate-[-15deg]">
            <img 
              src={logoSrc} 
              alt={logoAlt} 
              className="w-full h-full object-contain"
            />
          </div>
        </div>
        
        {/* Dynamic tagline - centered with offset for logo */}
        <div className="flex-1 flex justify-center pl-24 sm:pl-36">
          <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
            {getTagline()}
          </h1>
        </div>
        
        {/* Decorative badge */}
        <Badge 
          variant="secondary" 
          className="hidden md:flex items-center gap-1 px-2 sm:px-3 py-0.5 sm:py-1 bg-gradient-to-r from-primary/10 to-emerald-500/10 border-primary/20 hover:from-primary/20 hover:to-emerald-500/20 transition-all duration-300"
        >
          <div className="size-1.5 sm:size-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] sm:text-xs font-medium">Active</span>
        </Badge>
      </div>
      
      {/* Bottom orange thick bar */}
      <div className="absolute bottom-0 left-0 right-0 h-2 sm:h-4 bg-orange-500 shadow-inner z-[5]" />
    </div>
  )
}

export { type BannerProps }
