"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { FileX, Inbox, SearchX, ServerOff } from "lucide-react"

type EmptyStateProps = {
  icon?: "inbox" | "file" | "search" | "server"
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

const iconMap = {
  inbox: Inbox,
  file: FileX,
  search: SearchX,
  server: ServerOff,
}

export function EmptyState({ 
  icon = "inbox", 
  title, 
  description, 
  action 
}: EmptyStateProps) {
  const Icon = iconMap[icon]

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Icon className="h-12 w-12 text-muted-foreground mb-4" />
        <CardTitle className="text-center mb-2">{title}</CardTitle>
        {description && (
          <CardDescription className="text-center mb-4 max-w-sm">
            {description}
          </CardDescription>
        )}
        {action && (
          <Button onClick={action.onClick}>
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
