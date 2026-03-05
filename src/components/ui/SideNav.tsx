"use client"
import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, List, PlaySquare, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Send", href: "/campaign", icon: PlaySquare },
    { name: "Lists", href: "/lists", icon: List },
]

export function SideNav() {
    const pathname = usePathname()

    // Don't show sidebar on login page
    if (pathname === '/login') return null

    return (
        <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-card/50 h-screen sticky top-0">
            <div className="p-6 flex items-center gap-3 border-b border-border mb-6">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center ring-1 ring-primary/20">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h2 className="font-bold tracking-tight">SMS Manager</h2>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">v1.0.0</p>
                </div>
            </div>

            <nav className="flex-1 px-3 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href))
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all group",
                                isActive
                                    ? "bg-primary/10 text-primary font-semibold"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            <item.icon className={cn(
                                "w-5 h-5 transition-transform",
                                isActive ? "scale-110" : "scale-100 group-hover:scale-110"
                            )} />
                            <span className="text-sm tracking-wide">
                                {item.name}
                            </span>
                        </Link>
                    )
                })}
            </nav>

            <div className="p-6 border-t border-border">
                <div className="bg-muted/50 p-4 rounded-xl">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Status</p>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-xs font-semibold">System Online</span>
                    </div>
                </div>
            </div>
        </aside>
    )
}
