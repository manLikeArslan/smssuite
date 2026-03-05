"use client"
import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, List, PlaySquare } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Send", href: "/campaign", icon: PlaySquare },
    { name: "Lists", href: "/lists", icon: List },
]

export function BottomNav() {
    const pathname = usePathname()

    return (
        <nav className="fixed bottom-0 left-0 right-0 border-t border-border bg-card/80 backdrop-blur-md z-50 lg:hidden">
            <div className="mx-auto max-w-md grid grid-cols-3 h-16">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href))
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 transition-all group",
                                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <item.icon className={cn(
                                "w-5 h-5 transition-transform",
                                isActive ? "scale-110" : "scale-100 group-hover:scale-110"
                            )} />
                            <span className="text-[10px] font-medium tracking-wide">
                                {item.name}
                            </span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
