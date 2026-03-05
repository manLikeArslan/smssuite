"use client";

import { useEffect, useState } from "react";
import { SimpleCard } from "@/components/ui/SimpleCard";
import { SimpleButton } from "@/components/ui/SimpleButton";
import { ArrowRight, RefreshCw, Send, Users, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface Stats {
  totalSent: number;
  coldOutreach: number;
  followUps: number;
  errors: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="flex flex-col p-6 gap-6 pb-32">
      <header className="flex justify-between items-center py-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">System is online</p>
        </div>
        <SimpleButton variant="ghost" size="icon" onClick={fetchStats} isLoading={loading}>
          <RefreshCw className="w-5 h-5 text-muted-foreground" />
        </SimpleButton>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <SimpleCard className="flex flex-col bg-primary/5 border-primary/10 lg:col-span-3">
          <span className="text-sm font-medium text-primary/80 mb-2">Total Managed</span>
          <div className="flex items-end gap-3">
            <span className="text-6xl font-bold tracking-tighter leading-none">
              {stats?.totalSent ?? 0}
            </span>
            <span className="text-sm font-medium text-muted-foreground mb-1">Numbers</span>
          </div>
        </SimpleCard>

        <SimpleCard className="p-4 py-6">
          <div className="flex items-center gap-2 text-muted-foreground mb-4">
            <Send className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">New</span>
          </div>
          <span className="text-3xl font-bold">{stats?.coldOutreach ?? 0}</span>
        </SimpleCard>

        <SimpleCard className="p-4 py-6">
          <div className="flex items-center gap-2 text-muted-foreground mb-4">
            <Users className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Follow-ups</span>
          </div>
          <span className="text-3xl font-bold">{stats?.followUps ?? 0}</span>
        </SimpleCard>

        {stats?.errors ? (
          <SimpleCard className="border-destructive/20 bg-destructive/5 p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm font-semibold">{stats.errors} Errors Found</p>
              <p className="text-xs text-muted-foreground">Check logs</p>
            </div>
          </SimpleCard>
        ) : (
          <SimpleCard className="p-4 py-6 bg-emerald-500/5 border-emerald-500/10">
            <div className="flex items-center gap-2 text-emerald-500 mb-4">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Health</span>
            </div>
            <span className="text-sm font-bold text-emerald-600">All systems optimal</span>
          </SimpleCard>
        )}
      </div>

      <div className="mt-4 lg:mt-8">
        <Link href="/campaign" className="block max-w-sm">
          <SimpleButton variant="primary" size="lg" className="w-full h-16 text-lg font-bold gap-4 shadow-lg shadow-primary/20">
            Start Sending <ArrowRight className="w-5 h-5" />
          </SimpleButton>
        </Link>
      </div>
    </div>
  );
}
