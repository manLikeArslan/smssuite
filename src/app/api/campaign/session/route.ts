export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startCampaignSession, activeSessions } from "@/lib/runner";

export async function POST(req: Request) {
    try {
        const { mode, isDryRun, limit } = await req.json();

        if (!mode || limit === undefined) {
            return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
        }

        const activeList = await prisma.list.findFirst({
            where: { isActive: true }
        });

        if (!activeList) {
            return NextResponse.json({ error: "No active list selected" }, { status: 400 });
        }

        // Check if there is already an active session
        const existingSession = await prisma.campaignSession.findFirst({
            where: {
                status: { in: ["running", "paused"] }
            }
        });

        if (existingSession && existingSession.status === "running") {
             return NextResponse.json({ error: "A session is already running" }, { status: 400 });
        }

        let sessionId = existingSession?.id;

        // If resuming a paused session
        if (existingSession && existingSession.status === "paused") {
             await prisma.campaignSession.update({
                 where: { id: sessionId },
                 data: { status: "running" }
             });
        } else {
             // Create a new session
             const session = await prisma.campaignSession.create({
                 data: {
                     mode,
                     isDryRun,
                     totalTargets: limit,
                     listId: activeList.id,
                     status: "running"
                 }
             });
             sessionId = session.id;
        }

        // Start the background runner loop without awaiting it
        startCampaignSession(sessionId!);

        return NextResponse.json({ success: true, sessionId });

    } catch (error) {
        console.error("SESSION_START_ERROR:", error);
        return NextResponse.json({ error: "Failed to start session" }, { status: 500 });
    }
}

export async function GET() {
    try {
        const session = await prisma.campaignSession.findFirst({
            where: {
                status: { in: ["running", "paused", "completed", "error"] }
            },
            orderBy: {
                createdAt: "desc"
            },
            include: {
                logs: {
                    orderBy: { createdAt: "asc" }
                }
            }
        });

        if (!session) {
            return NextResponse.json({ session: null });
        }

        // Ensure accurate running state based on in-memory tracker
        let actualStatus = session.status;
        if (session.status === "running" && !activeSessions.has(session.id)) {
             // In case the server restarted while running
             actualStatus = "paused";
             await prisma.campaignSession.update({
                 where: { id: session.id },
                 data: { status: "paused" }
             });
             await prisma.campaignLog.create({
                 data: {
                     sessionId: session.id,
                     message: "Session paused due to server restart",
                     type: "warning",
                     time: new Date().toLocaleTimeString([], { hour12: false })
                 }
             });
        }

        return NextResponse.json({
            session: {
                ...session,
                status: actualStatus
            }
        });

    } catch (error) {
        console.error("SESSION_GET_ERROR:", error);
        return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 });
    }
}
