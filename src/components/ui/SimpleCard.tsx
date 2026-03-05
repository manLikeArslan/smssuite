import * as React from "react"
import { cn } from "@/lib/utils"

interface SimpleCardProps extends React.HTMLAttributes<HTMLDivElement> {
    title?: string
    description?: string
}

export function SimpleCard({ className, title, description, children, ...props }: SimpleCardProps) {
    return (
        <div className={cn("simple-card", className)} {...props}>
            {(title || description) && (
                <div className="mb-4">
                    {title && <h3 className="text-lg font-semibold leading-none">{title}</h3>}
                    {description && <p className="text-sm text-muted-foreground mt-1.5">{description}</p>}
                </div>
            )}
            {children}
        </div>
    )
}
