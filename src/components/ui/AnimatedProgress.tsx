"use client"
import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export interface AnimatedProgressProps extends React.HTMLAttributes<HTMLDivElement> {
    value: number // 0 to 100
    color?: "blue" | "purple" | "pink"
}

export function AnimatedProgress({
    value,
    color = "blue",
    className,
    ...props
}: AnimatedProgressProps) {
    const bgColors = {
        blue: "bg-primary shadow-[0_0_10px_var(--color-primary)]",
        purple: "bg-secondary shadow-[0_0_10px_var(--color-secondary)]",
        pink: "bg-accent shadow-[0_0_10px_var(--color-accent)]",
    }

    const clampedValue = Math.min(Math.max(value, 0), 100)

    return (
        <div
            className={cn("w-full h-8 bg-input border border-border relative overflow-hidden", className)}
            {...props}
        >
            {/* Track */}
            {/* Fill */}
            <motion.div
                className={cn("h-full border-r border-border", bgColors[color])}
                initial={{ width: 0 }}
                animate={{ width: `${clampedValue}%` }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
            />
            {/* Pattern overlay for extra tech vibe */}
            <div
                className="absolute inset-x-0 bottom-0 top-0 opacity-20 pointer-events-none"
                style={{
                    backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(0,0,0,0.5) 5px, rgba(0,0,0,0.5) 10px)"
                }}
            />
        </div>
    )
}
