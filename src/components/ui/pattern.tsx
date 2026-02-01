import * as React from "react"
import { cn } from "@/lib/utils"

interface PatternProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "dots" | "grid" | "lines" | "hexagon"
}

export function Pattern({ 
    className, 
    variant = "grid",
    ...props 
}: PatternProps) {
    return (
        <div
            className={cn("absolute inset-0", className)}
            style={{
                backgroundColor: 'transparent',
                backgroundImage: `
                    linear-gradient(0deg, transparent 24%, rgba(77, 171, 88, 0.3) 25%, rgba(77, 171, 88, 0.3) 26%, transparent 27%, transparent 74%, rgba(77, 171, 88, 0.3) 75%, rgba(77, 171, 88, 0.3) 76%, transparent 77%, transparent),
                    linear-gradient(90deg, transparent 24%, rgba(77, 171, 88, 0.3) 25%, rgba(77, 171, 88, 0.3) 26%, transparent 27%, transparent 74%, rgba(77, 171, 88, 0.3) 75%, rgba(77, 171, 88, 0.3) 76%, transparent 77%, transparent)
                `,
                backgroundSize: '30px 30px',
            }}
            {...props}
        />
    )
}
