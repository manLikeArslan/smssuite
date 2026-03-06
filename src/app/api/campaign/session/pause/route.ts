export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { activeSessions, addLog } from "@/lib/runner";

export async function POST() {
    try {
        const session = await prisma.campaignSession.findFirst({
            where: { status: "running" }
        });

        if (!session) {
            return NextResponse.json({ error: "No running session found" }, { status: 400 });
        }

        // Remove from active runner tracker
        activeSessions.delete(session.id);

        // Update database state
        await prisma.campaignSession.update({
            where: { id: session.id },
            data: { status: "paused" }
        });

        await addLog(session.id, "Manual pause requested", "warning");

        return NextResponse.json({ success: true, sessionId: session.id });

    } catch (error) {
        console.error("SESSION_PAUSE_ERROR:", error);
        return NextResponse.json({ error: "Failed to pause session" }, { status: 500 });
    }
}