import * as React from "react"
import { cn } from "@/lib/utils"

export interface NeonCardProps extends React.HTMLAttributes<HTMLDivElement> {
    glowColor?: "blue" | "purple" | "pink" | "none"
}

export function NeonCard({
    className,
    glowColor = "none",
    children,
    ...props
}: NeonCardProps) {
    const glowStyles = {
        blue: "border-primary shadow-[4px_4px_0px_var(--color-primary)]",
        purple: "border-secondary shadow-[4px_4px_0px_var(--color-secondary)]",
        pink: "border-accent shadow-[4px_4px_0px_var(--color-accent)]",
        none: "border-border shadow-[4px_4px_0px_#22222a]",
    }

    return (
        <div
            className={cn(
                "brutal-panel p-6 relative overflow-hidden transition-all duration-300",
                glowStyles[glowColor],
                className
            )}
            {...props}
        >
            <div className="relative z-10">{children}</div>
        </div>
    )
}
