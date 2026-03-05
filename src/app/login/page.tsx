"use client";

import { useState } from "react";
import { SimpleCard } from "@/components/ui/SimpleCard";
import { SimpleButton } from "@/components/ui/SimpleButton";
import { Lock, AlertCircle, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function LoginPage() {
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            });

            if (res.ok) {
                router.push("/");
                router.refresh();
            } else {
                setError("Invalid password. Please try again.");
            }
        } catch (err) {
            setError("Something went wrong. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-sm"
            >
                <div className="flex flex-col items-center mb-10">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 ring-1 ring-primary/20">
                        <ShieldCheck className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">Access Restricted</h1>
                    <p className="text-sm text-muted-foreground mt-2">Enter password to continue</p>
                </div>

                <SimpleCard className="p-6">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <div className="relative">
                                <input
                                    type="password"
                                    className="simple-input w-full pr-10"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoFocus
                                />
                                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            </div>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg flex items-center gap-3"
                            >
                                <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
                                <p className="text-xs font-medium text-destructive">{error}</p>
                            </motion.div>
                        )}

                        <SimpleButton
                            type="submit"
                            variant="primary"
                            className="w-full h-12 font-bold"
                            isLoading={loading}
                            disabled={!password}
                        >
                            Sign In
                        </SimpleButton>
                    </form>
                </SimpleCard>

                <p className="text-center text-[10px] text-muted-foreground mt-8 uppercase tracking-[0.2em] font-medium opacity-50">
                    SMS Manager &bull; v1.0.0 &bull; Private Access
                </p>
            </motion.div>
        </div>
    );
}
