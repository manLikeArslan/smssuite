"use client";

import { useState, useEffect, useRef } from "react";
import { SimpleCard } from "@/components/ui/SimpleCard";
import { SimpleButton } from "@/components/ui/SimpleButton";
import { Play, Square, Settings2, ShieldQuestion, CheckCircle2, AlertCircle, Info, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface LogEntry {
    id: string;
    time: string;
    message: string;
    type: "info" | "success" | "error" | "warning";
    duration?: number; // Optional duration for progress bar in ms
}

const PERSIST_KEY = "sms_campaign_state";

export default function CampaignPage() {
    const [mode, setMode] = useState<"cold" | "followup">("cold");
    const [isDryRun, setIsDryRun] = useState(false);
    const [limit, setLimit] = useState<number>(0);
    const [maxAvailable, setMaxAvailable] = useState<number>(0);

    const [isRunning, setIsRunning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentCount, setCurrentCount] = useState(0);
    const [logs, setLogs] = useState<LogEntry[]>([]);

    const [loadingConfig, setLoadingConfig] = useState(false);

    // Ref to hold running state for the async loop
    const runningRef = useRef(false);
    const logsEndRef = useRef<HTMLDivElement>(null);

    // Persistence Loading
    useEffect(() => {
        const saved = localStorage.getItem(PERSIST_KEY);
        if (saved) {
            try {
                const state = JSON.parse(saved);
                setMode(state.mode || "cold");
                setIsDryRun(!!state.isDryRun);
                setLimit(state.limit || 0);
                setProgress(state.progress || 0);
                setCurrentCount(state.currentCount || 0);
                setLogs(state.logs || []);
                // We don't auto-resume isRunning for safety, but state is ready
            } catch (e) {
                console.error("Failed to restore campaign state", e);
            }
        }
    }, []);

    // Persistence Saving
    useEffect(() => {
        const state = { mode, isDryRun, limit, progress, currentCount, logs };
        localStorage.setItem(PERSIST_KEY, JSON.stringify(state));
    }, [mode, isDryRun, limit, progress, currentCount, logs]);

    const addLog = (message: string, type: LogEntry['type'] = "info", duration?: number) => {
        setLogs(prev => [...prev.slice(-99), {
            id: Math.random().toString(36).substring(7),
            time: new Date().toLocaleTimeString([], { hour12: false }),
            message,
            type,
            duration
        }]);
    };

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    const fetchTargetsCount = async () => {
        setLoadingConfig(true);
        try {
            const res = await fetch(`/api/campaign/targets?mode=${mode}&countOnly=true`);
            if (!res.ok) {
                const error = await res.json();
                addLog(`Sync error: ${error.error || res.statusText}`, "error");
                setMaxAvailable(0);
                return;
            }
            const data = await res.json();
            const newMax = data.count || 0;
            setMaxAvailable(newMax);

            // Only auto-update limit if it's currently 0 or exceeding the new max
            setLimit(prev => {
                if (prev === 0 || prev > newMax) return newMax;
                return prev;
            });
        } catch (e) {
            addLog("Connection failure.", "error");
        } finally {
            setLoadingConfig(false);
        }
    };

    useEffect(() => {
        if (!isRunning) {
            fetchTargetsCount();
        }
    }, [mode]);

    const getRandomDelay = () => Math.floor(Math.random() * (25 - 15 + 1) + 15) * 1000;
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const startCampaign = async (isResuming = false) => {
        if (limit <= 0) {
            addLog("Please select numbers to send.", "error");
            return;
        }

        setIsRunning(true);
        runningRef.current = true;

        if (!isResuming) {
            setProgress(0);
            setCurrentCount(0);
            setLogs([]);
            addLog(`Started ${mode === 'cold' ? 'New Contact' : 'Follow-up'} session`, "info");
        } else {
            addLog(`Resuming session from ${currentCount}`, "info");
        }

        if (isDryRun) addLog("Mode: Simulation Only (No texts sent)", "warning");

        let count = isResuming ? currentCount : 0;
        const BATCH_SIZE = 50;

        while (count < limit && runningRef.current) {
            try {
                const res = await fetch(`/api/campaign/targets?mode=${mode}&skip=${count}&take=${BATCH_SIZE}`);
                if (!res.ok) throw new Error("Batch fetch failed");
                const data = await res.json();
                const currentBatch = data.targets || [];

                if (currentBatch.length === 0) break;

                for (let i = 0; i < currentBatch.length && count < limit; i++) {
                    if (!runningRef.current) break;

                    const target = currentBatch[i];
                    const phone = String(target.phone);
                    const delayMs = getRandomDelay();

                    if (isDryRun) {
                        addLog(`Simulation: ${phone}`, "info");
                    } else {
                        try {
                            const sendRes = await fetch("/api/campaign/send", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    contactId: target.id,
                                    phone: phone,
                                    mode,
                                    isDryRun: false
                                })
                            });

                            if (sendRes.ok) {
                                addLog(`Sent to ${phone}`, "success");
                            } else {
                                addLog(`Failed for ${phone}`, "error");
                            }
                        } catch (e) {
                            addLog(`Network error for ${phone}`, "error");
                        }
                    }

                    count++;
                    const newProgress = (count / limit) * 100;
                    setProgress(newProgress);
                    setCurrentCount(count);

                    if (count < limit && runningRef.current) {
                        const seconds = Math.floor(delayMs / 1000);
                        addLog(`Waiting ${seconds}s...`, "info", delayMs);
                        await sleep(delayMs);
                    }
                }
            } catch (e) {
                addLog("Stopped due to error.", "error");
                break;
            }
        }

        setIsRunning(false);
        runningRef.current = false;
        if (count >= limit || !runningRef.current) {
            addLog(`Session finished: ${count} completed`, "success");
        }
    };

    const stopCampaign = () => {
        runningRef.current = false;
        addLog("Manual stop requested", "warning");
    };

    const clearSession = () => {
        if (!confirm("Clear current session state and logs?")) return;
        localStorage.removeItem(PERSIST_KEY);
        setProgress(0);
        setCurrentCount(0);
        setLogs([]);
        setLimit(maxAvailable);
    };

    return (
        <div className="flex flex-col p-6 gap-6 pb-32">
            <header className="flex justify-between items-center py-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Send</h1>
                    <p className="text-sm text-muted-foreground mt-1">Start messaging session</p>
                </div>
                {currentCount > 0 && !isRunning && (
                    <SimpleButton variant="ghost" size="icon" onClick={clearSession} title="Clear Session">
                        <RefreshCw className="w-4 h-4 text-muted-foreground" />
                    </SimpleButton>
                )}
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <SimpleCard className="p-0 overflow-hidden lg:sticky lg:top-24">
                    <div className="p-6 space-y-8">
                        <div className={`space-y-8 ${isRunning ? "opacity-30 pointer-events-none" : ""}`}>
                            <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-xl">
                                <button
                                    onClick={() => setMode("cold")}
                                    className={cn(
                                        "py-3 rounded-lg text-sm font-semibold transition-all",
                                        mode === "cold" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    New Contact
                                </button>
                                <button
                                    onClick={() => setMode("followup")}
                                    className={cn(
                                        "py-3 rounded-lg text-sm font-semibold transition-all",
                                        mode === "followup" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    Follow-up
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                        <ShieldQuestion className="w-4 h-4 text-primary" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold">Test Mode</span>
                                        <span className="text-xs text-muted-foreground">Don't send real texts</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsDryRun(!isDryRun)}
                                    className={cn(
                                        "w-12 h-6 rounded-full transition-all relative flex items-center px-1",
                                        isDryRun ? "bg-primary" : "bg-muted-foreground/30"
                                    )}
                                >
                                    <motion.div
                                        className="w-4 h-4 bg-white rounded-full shadow-sm"
                                        animate={{ x: isDryRun ? 24 : 0 }}
                                    />
                                </button>
                            </div>

                            <div>
                                <div className="flex justify-between items-end mb-2">
                                    <label className="text-sm font-semibold">Targets</label>
                                    <span className="text-xs text-muted-foreground">{maxAvailable} available</span>
                                </div>
                                <input
                                    type="number"
                                    value={limit}
                                    onChange={(e) => setLimit(Number(e.target.value))}
                                    max={maxAvailable}
                                    min={0}
                                    className="w-full bg-muted/20 border-2 border-border text-foreground p-4 rounded-xl text-4xl font-bold tracking-tight focus:outline-none focus:border-primary transition-all tabular-nums"
                                />
                            </div>
                        </div>

                        {!isRunning ? (
                            <div className="flex flex-col gap-3">
                                <SimpleButton
                                    variant="primary"
                                    className="w-full h-16 text-xl font-bold gap-3 shadow-lg shadow-primary/20"
                                    onClick={() => startCampaign(false)}
                                    disabled={loadingConfig || maxAvailable === 0 || limit <= 0}
                                >
                                    <Play className="w-5 h-5 fill-current" /> {currentCount > 0 ? "Restart Session" : "Start Session"}
                                </SimpleButton>

                                {currentCount > 0 && currentCount < limit && (
                                    <SimpleButton
                                        variant="outline"
                                        className="w-full h-14 font-bold border-primary/20 text-primary hover:bg-primary/5"
                                        onClick={() => startCampaign(true)}
                                    >
                                        Resume Session ({progress.toFixed(0)}%)
                                    </SimpleButton>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-primary"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        transition={{ duration: 0.5 }}
                                    />
                                </div>
                                <div className="flex justify-between text-xs font-semibold text-muted-foreground italic tracking-wide">
                                    <span>{Math.round(progress)}% Complete</span>
                                    <span className="animate-pulse text-primary flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full" /> Active Session
                                    </span>
                                </div>
                                <SimpleButton
                                    variant="outline"
                                    className="w-full h-14 border-destructive/20 text-destructive hover:bg-destructive/5 font-bold"
                                    onClick={stopCampaign}
                                >
                                    <Square className="w-4 h-4 fill-current mr-2" /> Stop Session
                                </SimpleButton>
                            </div>
                        )}
                    </div>
                </SimpleCard>

                <SimpleCard className="p-0 overflow-hidden flex flex-col min-h-[500px] lg:col-span-2">
                    <div className="px-5 py-4 border-b border-border bg-muted/30 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Info className="w-4 h-4 text-muted-foreground" />
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Session Log</span>
                        </div>
                    </div>
                    <div className="flex-1 p-5 overflow-y-auto max-h-[600px] lg:max-h-[800px]">
                        <AnimatePresence mode="popLayout">
                            {logs.length === 0 ? (
                                <p className="text-sm text-center text-muted-foreground py-10 italic">Ready to start...</p>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {logs.map((log) => (
                                        <motion.div
                                            key={log.id}
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={cn(
                                                "flex flex-col text-sm p-3 rounded-lg relative overflow-hidden",
                                                log.type === "error" ? "bg-destructive/10 text-destructive" :
                                                    log.type === "success" ? "bg-primary/10 text-primary font-medium" :
                                                        log.type === "warning" ? "bg-yellow-500/10 text-yellow-500 italic" :
                                                            "bg-muted/50 text-foreground/80"
                                            )}
                                        >
                                            <div className="flex gap-3 relative z-10">
                                                <span className="opacity-40 tabular-nums shrink-0 font-mono text-[10px]">{log.time}</span>
                                                <span className="flex-1 leading-tight">{log.message}</span>
                                            </div>
                                            {log.duration && (
                                                <motion.div
                                                    className="absolute bottom-0 left-0 h-1 bg-primary/20"
                                                    initial={{ width: "0%" }}
                                                    animate={{ width: "100%" }}
                                                    transition={{ duration: log.duration / 1000, ease: "linear" }}
                                                />
                                            )}
                                        </motion.div>
                                    ))}
                                    <div ref={logsEndRef} />
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </SimpleCard>
            </div>
        </div>
    );
}
