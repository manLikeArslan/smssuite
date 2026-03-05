"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { motion, HTMLMotionProps } from "framer-motion"

export interface NeonButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
    variant?: "primary" | "secondary" | "danger" | "ghost"
    size?: "sm" | "md" | "lg" | "icon"
    isLoading?: boolean
}

export const NeonButton = React.forwardRef<HTMLButtonElement, NeonButtonProps>(
    ({ className, variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {
        const variants = {
            primary:
                "bg-primary text-black font-bold border border-primary hover:bg-black hover:text-primary hover:shadow-[4px_4px_0px_var(--color-primary)]",
            secondary:
                "bg-secondary text-white font-bold border border-secondary hover:bg-black hover:text-secondary hover:shadow-[4px_4px_0px_var(--color-secondary)]",
            danger:
                "bg-destructive text-white font-bold border border-destructive hover:bg-black hover:text-destructive hover:shadow-[4px_4px_0px_var(--color-destructive)]",
            ghost:
                "bg-transparent text-foreground border border-transparent hover:border-foreground hover:shadow-[4px_4px_0px_#ffffff]",
        }

        const sizes = {
            sm: "h-9 px-4 text-xs",
            md: "h-12 px-6 text-sm",
            lg: "h-14 px-8 text-base",
            icon: "h-12 w-12 flex items-center justify-center",
        }

        return (
            <motion.button
                ref={ref}
                whileTap={{ scale: disabled || isLoading ? 1 : 0.98, x: 2, y: 2, boxShadow: "0px 0px 0px transparent" }}
                className={cn(
                    "relative inline-flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 uppercase tracking-wider",
                    variants[variant],
                    sizes[size],
                    className
                )}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                        <div className="w-5 h-5 border-2 border-current border-t-transparent animate-spin rounded-full" />
                    </div>
                )}
                <span className="relative z-10 flex items-center gap-2">{children as React.ReactNode}</span>
            </motion.button>
        )
    }
)
NeonButton.displayName = "NeonButton"
