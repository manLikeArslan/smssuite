"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { motion, HTMLMotionProps } from "framer-motion"

export interface SimpleButtonProps extends Omit<HTMLMotionProps<"button">, "variant"> {
    variant?: "primary" | "secondary" | "outline" | "ghost" | "danger"
    size?: "sm" | "md" | "lg" | "icon"
    isLoading?: boolean
}

export const SimpleButton = React.forwardRef<HTMLButtonElement, SimpleButtonProps>(
    ({ className, variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {
        const variants = {
            primary: "bg-primary text-primary-foreground shadow-sm hover:brightness-110",
            secondary: "bg-secondary text-secondary-foreground hover:bg-muted",
            outline: "bg-transparent border border-border hover:bg-muted text-foreground",
            ghost: "bg-transparent hover:bg-muted text-foreground",
            danger: "bg-destructive text-destructive-foreground hover:brightness-110",
        }

        const sizes = {
            sm: "h-9 px-3 text-xs",
            md: "h-11 px-5 text-sm",
            lg: "h-14 px-8 text-base",
            icon: "h-11 w-11 flex items-center justify-center",
        }

        return (
            <motion.button
                ref={ref}
                whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
                className={cn(
                    "simple-button disabled:opacity-50 disabled:pointer-events-none transition-colors",
                    variants[variant],
                    sizes[size],
                    className
                )}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent animate-spin rounded-full" />
                ) : (
                    children
                )}
            </motion.button>
        )
    }
)
SimpleButton.displayName = "SimpleButton"
