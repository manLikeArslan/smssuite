"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { motion, HTMLMotionProps } from "framer-motion"

export interface SwissButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
    variant?: "primary" | "secondary" | "outline" | "ghost" | "danger"
    size?: "sm" | "md" | "lg" | "icon"
    isLoading?: boolean
}

export const SwissButton = React.forwardRef<HTMLButtonElement, SwissButtonProps>(
    ({ className, variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {
        const variants = {
            primary: "bg-primary text-white font-bold border border-primary hover:bg-white hover:text-black",
            secondary: "bg-white text-black font-bold border border-white hover:bg-black hover:text-white",
            outline: "bg-transparent text-white font-bold border border-white hover:bg-white hover:text-black",
            ghost: "bg-transparent text-white border border-transparent hover:border-white",
            danger: "bg-primary text-white font-bold border border-primary hover:bg-white hover:text-primary",
        }

        const sizes = {
            sm: "h-10 px-4 text-[10px]",
            md: "h-14 px-8 text-xs",
            lg: "h-20 px-10 text-base",
            icon: "h-14 w-14 flex items-center justify-center",
        }

        return (
            <motion.button
                ref={ref}
                whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
                className={cn(
                    "relative inline-flex items-center justify-center transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 uppercase tracking-[0.15em] font-display",
                    variants[variant],
                    sizes[size],
                    className
                )}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                        <div className="w-4 h-4 border border-current border-t-transparent animate-spin" />
                    </div>
                )}
                <span className="relative z-10 flex items-center gap-3">{children as React.ReactNode}</span>
            </motion.button>
        )
    }
)
SwissButton.displayName = "SwissButton"
