"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

/* ---------- TYPES ---------- */

export interface DatePickerProps {
  value?: Date
  onChange?: (date?: Date) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  inputClassName?: string
  locale?: Intl.LocalesArgument
  formatDate?: (date?: Date) => string
}

/* ---------- DEFAULT FORMAT ---------- */

function defaultFormatDate(
  date?: Date,
  locale: Intl.LocalesArgument = "en-US"
) {
  if (!date) return ""
  return date.toLocaleDateString(locale, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

/* ---------- COMPONENT ---------- */

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  disabled,
  className,
  inputClassName,
  locale = "en-US",
  formatDate,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [month, setMonth] = React.useState<Date | undefined>(value)

  const displayValue = React.useMemo(() => {
    const formatter = formatDate ?? ((d?: Date) => defaultFormatDate(d, locale))
    return formatter(value)
  }, [value, formatDate, locale])

  return (
    <div className={cn("relative", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Input
              value={displayValue}
              placeholder={placeholder}
              readOnly
              disabled={disabled}
              className={cn("pr-10 cursor-pointer", inputClassName)}
            />
            <Button
              type="button"
              variant="ghost"
              disabled={disabled}
              className="absolute right-0.5 top-1/2 h-5 w-5 -translate-y-1/2 p-0"
            >
              <CalendarIcon className="h-3 w-3" />
            </Button>
          </div>
        </PopoverTrigger>

        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={value}
            month={month}
            onMonthChange={setMonth}
            onSelect={(date) => {
              onChange?.(date)
              setOpen(false)
            }}
            captionLayout="dropdown"
            disabled={disabled}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
