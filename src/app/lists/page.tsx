"use client";

import { useState, useEffect } from "react";
import { SimpleCard } from "@/components/ui/SimpleCard";
import { SimpleButton } from "@/components/ui/SimpleButton";
import { List as ListIcon, Trash2, ShieldCheck, Upload, Clock, Plus, Database } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ListData {
    id: string;
    name: string;
    isActive: boolean;
    createdAt: string;
    _count: { contacts: number };
    stats: {
        sent: number;
        followUps: number;
        remaining: number;
    };
}

export default function ListsPage() {
    const [lists, setLists] = useState<ListData[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLists = async () => {
        try {
            const res = await fetch("/api/lists");
            if (res.ok) {
                const data = await res.json();
                setLists(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLists();
    }, []);

    const setActive = async (id: string) => {
        try {
            await fetch(`/api/lists/${id}`, { method: "PUT" });
            fetchLists();
        } catch (e) {
            console.error(e);
        }
    };

    const deleteList = async (id: string) => {
        if (!confirm("Delete this list? This cannot be undone.")) return;
        try {
            await fetch(`/api/lists/${id}`, { method: "DELETE" });
            fetchLists();
        } catch (e) {
            console.error(e);
        }
    };

    const resetProgress = async (id: string) => {
        if (!confirm("Restart sequence for this list?")) return;
        try {
            const res = await fetch(`/api/lists/${id}/reset`, { method: "PUT" });
            if (res.ok) {
                fetchLists();
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="flex flex-col p-6 gap-6 pb-32">
            <header className="flex justify-between items-center py-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Numbers</h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage your lists</p>
                </div>
                <Link href="/lists/upload">
                    <SimpleButton size="icon" variant="primary" className="rounded-full">
                        <Plus className="w-5 h-5" />
                    </SimpleButton>
                </Link>
            </header>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent animate-spin rounded-full" />
                </div>
            ) : lists.length === 0 ? (
                <div className="text-center py-20 px-6 border-2 border-dashed border-border rounded-2xl bg-muted/20">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                        <Database className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold">No Lists Yet</h3>
                    <p className="text-sm text-muted-foreground mt-2 max-w-[200px] mx-auto">
                        Upload a CSV file to start managing your numbers.
                    </p>
                    <Link href="/lists/upload" className="mt-8 block">
                        <SimpleButton variant="outline">Upload New List</SimpleButton>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {lists.map((list) => (
                            <motion.div
                                key={list.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                            >
                                <SimpleCard className={cn(
                                    "p-0 overflow-hidden relative transition-all",
                                    list.isActive ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
                                )}>
                                    <div className="p-5 flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-lg">{list.name}</h3>
                                                {list.isActive && (
                                                    <span className="flex items-center gap-1 text-[10px] font-bold bg-primary text-white px-2 py-0.5 rounded-full uppercase">
                                                        <ShieldCheck className="w-3 h-3" /> Active
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {list._count.contacts.toLocaleString()} Numbers
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => deleteList(list.id)}
                                            className="h-8 w-8 shrink-0 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                            title="Delete list"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                                        </button>
                                    </div>

                                    <div className="px-5 pb-5 grid grid-cols-3 gap-2">
                                        <div className="bg-muted/30 rounded-lg p-2 flex flex-col items-center">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Sent</span>
                                            <span className="text-sm font-bold">{list.stats.sent}</span>
                                        </div>
                                        <div className="bg-muted/30 rounded-lg p-2 flex flex-col items-center">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Followup</span>
                                            <span className="text-sm font-bold">{list.stats.followUps}</span>
                                        </div>
                                        <div className="bg-muted/30 rounded-lg p-2 flex flex-col items-center">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Left</span>
                                            <span className="text-sm font-bold">{list.stats.remaining}</span>
                                        </div>
                                    </div>

                                    <div className="p-3 bg-muted/30 border-t border-border flex gap-2">
                                        {!list.isActive ? (
                                            <SimpleButton
                                                variant="secondary"
                                                className="w-full h-10 text-xs font-semibold"
                                                onClick={() => setActive(list.id)}
                                            >
                                                Select List
                                            </SimpleButton>
                                        ) : (
                                            <SimpleButton
                                                variant="outline"
                                                className="w-full h-10 text-xs font-semibold"
                                                onClick={() => resetProgress(list.id)}
                                            >
                                                Restart Sequence
                                            </SimpleButton>
                                        )}
                                    </div>
                                </SimpleCard>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
