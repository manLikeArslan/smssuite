export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startCampaignSession } from "@/lib/runner";

export async function POST() {
    try {
        const session = await prisma.campaignSession.findFirst({
            where: { status: "paused" }
        });

        if (!session) {
            return NextResponse.json({ error: "No paused session found" }, { status: 400 });
        }

        await prisma.campaignSession.update({
            where: { id: session.id },
            data: { status: "running" }
        });

        // Trigger background loop
        startCampaignSession(session.id);

        return NextResponse.json({ success: true, sessionId: session.id });

    } catch (error) {
        console.error("SESSION_RESUME_ERROR:", error);
        return NextResponse.json({ error: "Failed to resume session" }, { status: 500 });
    }
}