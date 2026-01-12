// Komponen summary card dashboard controller/owner
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardFooter,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { IconTrendingUp, IconTrendingDown } from "@tabler/icons-react"
import { cn } from "@/lib/utils"

export interface DashboardCard {
  key: string
  title: string
  value: number | string
  subLabel?: string
  color?: string
  onClick?: () => void
  selected?: boolean
  trend?: "up" | "down"
  trendValue?: string
  description?: string
  footerNote?: string
}

export function SummaryCard({ card }: { card: DashboardCard }) {
  return (
    <Card
      data-slot="card"
      onClick={card.onClick}
      className={cn(
        "@container/card cursor-pointer border-2 transition-all duration-200",
        card.selected
          ? "border-primary shadow-lg -translate-y-1"
          : "border-transparent hover:shadow-md hover:-translate-y-1",
        card.color
      )}
    >
      <CardHeader>
        <CardDescription>
          {card.description || card.title}
        </CardDescription>

        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {card.value}
        </CardTitle>

        <CardAction>
          {card.trend && (
            <Badge variant="outline" className="flex items-center gap-1">
              {card.trend === "up" ? (
                <IconTrendingUp className="size-4" />
              ) : (
                <IconTrendingDown className="size-4" />
              )}
              {card.trendValue}
            </Badge>
          )}

          {!card.trend && card.subLabel && (
            <Badge variant="outline">
              {card.subLabel}
            </Badge>
          )}
        </CardAction>
      </CardHeader>

      {card.footerNote && (
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex gap-2 font-medium line-clamp-1">
            {card.footerNote}
            {card.trend === "up" && (
              <IconTrendingUp className="size-4" />
            )}
            {card.trend === "down" && (
              <IconTrendingDown className="size-4" />
            )}
          </div>

          <div className="text-muted-foreground">
            {card.title}
          </div>
        </CardFooter>
      )}
    </Card>
  )
}
