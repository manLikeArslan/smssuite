export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { activeSessions, addLog } from "@/lib/runner";

export async function POST() {
    try {
        const session = await prisma.campaignSession.findFirst({
            where: { status: { in: ["running", "paused"] } }
        });

        if (!session) {
            return NextResponse.json({ error: "No active session found" }, { status: 400 });
        }

        activeSessions.delete(session.id);

        // Delete the session entirely so the UI can cleanly reset and not re-poll it
        await prisma.campaignSession.delete({
            where: { id: session.id }
        });

        return NextResponse.json({ success: true, sessionId: session.id, cleared: true });

    } catch (error) {
        console.error("SESSION_STOP_ERROR:", error);
        return NextResponse.json({ error: "Failed to stop session" }, { status: 500 });
    }
}