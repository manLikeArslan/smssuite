import { prisma } from "./prisma";

// In-memory set to track which sessions are currently running
export const activeSessions = new Set<string>();

const getRandomDelay = () => Math.floor(Math.random() * (25 - 15 + 1) + 15) * 1000;
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function addLog(sessionId: string, message: string, type: "info" | "success" | "error" | "warning" = "info", duration?: number) {
    const time = new Date().toLocaleTimeString([], { hour12: false });
    await prisma.campaignLog.create({
        data: {
            sessionId,
            message,
            type,
            time,
            duration
        }
    });
}

export async function startCampaignSession(sessionId: string) {
    if (activeSessions.has(sessionId)) {
        console.log(`Session ${sessionId} is already running.`);
        return;
    }

    activeSessions.add(sessionId);

    try {
        await processCampaign(sessionId);
    } catch (e) {
        console.error(`Error in session ${sessionId}:`, e);
        await prisma.campaignSession.update({
            where: { id: sessionId },
            data: { status: "error" }
        });
        await addLog(sessionId, "Fatal error occurred, session stopped.", "error");
    } finally {
        activeSessions.delete(sessionId);
    }
}

async function processCampaign(sessionId: string) {
    const BATCH_SIZE = 50;

    let session = await prisma.campaignSession.findUnique({ where: { id: sessionId } });
    if (!session || session.status !== "running") return;

    if (session.processedCount === 0) {
        await addLog(sessionId, `Started ${session.mode === 'cold' ? 'New Contact' : 'Follow-up'} session`, "info");
        if (session.isDryRun) await addLog(sessionId, "Mode: Simulation Only (No texts sent)", "warning");
    } else {
        await addLog(sessionId, `Resuming session from ${session.processedCount}`, "info");
    }

    let count = session.processedCount;

    while (count < session.totalTargets && activeSessions.has(sessionId)) {
        // Re-check status in database in case it was paused via API
        session = await prisma.campaignSession.findUnique({ where: { id: sessionId } });
        if (!session || session.status !== "running") {
            break;
        }

        // Fetch targets based on mode
        let currentBatch = [];

        // If it's a dry run, the database status doesn't change, so we must manually skip the ones we processed.
        // If it's a real run, the items drop out of the query, so skip should always be 0.
        const skipCount = session.isDryRun ? count : 0;

        if (session.mode === "cold") {
            currentBatch = await prisma.contact.findMany({
                where: {
                    listId: session.listId,
                    AND: [
                        { OR: [ { status: null }, { status: { not: "sent" } }, { step: 0 } ] },
                        { OR: [ { blacklisted: null }, { blacklisted: { not: "True" } } ] }
                    ]
                },
                skip: skipCount,
                take: BATCH_SIZE,
                select: { id: true, phone: true, status: true }
            });
        } else if (session.mode === "followup") {
            const threeDaysAgo = new Date();
            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
            const dateStr = threeDaysAgo.toISOString().replace('T', ' ').substring(0, 16);

            currentBatch = await prisma.contact.findMany({
                where: {
                    listId: session.listId,
                    status: "sent",
                    step: { gte: 1 },
                    lastSent: { lte: dateStr }
                },
                skip: skipCount,
                take: BATCH_SIZE,
                select: { id: true, phone: true, status: true }
            });
        }

        if (currentBatch.length === 0) {
             break;
        }

        for (let i = 0; i < currentBatch.length && count < session.totalTargets; i++) {
            if (!activeSessions.has(sessionId)) break;

            const target = currentBatch[i];
            const phone = String(target.phone);
            const delayMs = getRandomDelay();

            if (session.isDryRun) {
                await addLog(sessionId, `Simulation: ${phone}`, "info");
            } else {
                try {
                    // Reusing the same POST logic but doing it server side.
                    // Actually, we can just call the pushcut logic directly here to avoid a fetch loop
                    const pushcutUrl = process.env.PUSHCUT_WEBHOOK_URL;
                    let success = false;

                    if (pushcutUrl) {
                         const res = await fetch(pushcutUrl, {
                             method: "POST",
                             headers: { "Content-Type": "application/json" },
                             body: JSON.stringify({ input: { number: phone } })
                         });
                         success = res.ok;
                    }

                    // Update stats
                    await prisma.stats.upsert({
                        where: { id: 1 },
                        update: {},
                        create: { id: 1, totalSent: 0, coldOutreach: 0, followUps: 0, errors: 0 }
                    });

                    if (success) {
                        await prisma.$transaction(async (tx) => {
                            const contact = await tx.contact.findUnique({ where: { id: target.id } });
                            if (contact) {
                                await tx.contact.update({
                                    where: { id: target.id },
                                    data: {
                                        status: "sent",
                                        step: contact.step + 1,
                                        lastSent: new Date().toISOString().replace('T', ' ').substring(0, 16)
                                    }
                                });
                            }
                            await tx.stats.update({
                                where: { id: 1 },
                                data: {
                                    totalSent: { increment: 1 },
                                    coldOutreach: session.mode === "cold" ? { increment: 1 } : undefined,
                                    followUps: session.mode === "followup" ? { increment: 1 } : undefined,
                                }
                            });
                        });
                        await addLog(sessionId, `Sent to ${phone}`, "success");
                    } else {
                        await prisma.stats.update({
                            where: { id: 1 },
                            data: { errors: { increment: 1 } }
                        });
                        await addLog(sessionId, `Failed for ${phone}`, "error");
                    }
                } catch (e) {
                    await addLog(sessionId, `Network error for ${phone}`, "error");
                }
            }

            count++;

            // Update session count
            await prisma.campaignSession.update({
                where: { id: sessionId },
                data: { processedCount: count }
            });

            if (count < session.totalTargets && activeSessions.has(sessionId)) {
                const seconds = Math.floor(delayMs / 1000);
                await addLog(sessionId, `Waiting ${seconds}s...`, "info", delayMs);
                await sleep(delayMs);
            }
        }
    }

    // Refresh session to check status
    session = await prisma.campaignSession.findUnique({ where: { id: sessionId } });
    if (session && session.status === "running") {
         if (count >= session.totalTargets || currentBatch?.length === 0) {
            await prisma.campaignSession.update({
                where: { id: sessionId },
                data: { status: "completed" }
            });
            await addLog(sessionId, `Session finished: ${count} completed`, "success");
         }
    }
}
