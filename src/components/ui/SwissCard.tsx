import * as React from "react"
import { cn } from "@/lib/utils"

export interface SwissCardProps extends React.HTMLAttributes<HTMLDivElement> {
    header?: string
    footer?: string
}

export function SwissCard({
    className,
    header,
    footer,
    children,
    ...props
}: SwissCardProps) {
    return (
        <div
            className={cn(
                "swiss-panel space-y-4",
                className
            )}
            {...props}
        >
            {header && (
                <div className="border-b border-border pb-2 mb-4">
                    <span className="swiss-label">{header}</span>
                </div>
            )}
            <div className="relative z-10 font-sans tracking-normal">{children}</div>
            {footer && (
                <div className="border-t border-border pt-4 mt-4 bg-muted/30 -mx-4 px-4 py-2">
                    <span className="swiss-label !mb-0">{footer}</span>
                </div>
            )}
        </div>
    )
}
