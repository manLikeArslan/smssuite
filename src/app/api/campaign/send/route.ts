export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const { contactId, phone, mode, isDryRun } = await req.json();

        if (!contactId || !phone || !mode) {
            return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
        }

        const pushcutUrl = process.env.PUSHCUT_WEBHOOK_URL;
        if (!pushcutUrl && !isDryRun) {
            return NextResponse.json({ error: "Pushcut URL not configured" }, { status: 500 });
        }

        let success = true;

        if (!isDryRun) {
            try {
                const res = await fetch(pushcutUrl!, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ input: { number: phone } })
                });
                success = res.ok;
            } catch (e) {
                success = false;
            }
        }

        // Initialize stats
        await prisma.stats.upsert({
            where: { id: 1 },
            update: {},
            create: { id: 1, totalSent: 0, coldOutreach: 0, followUps: 0, errors: 0 }
        });

        if (success && !isDryRun) {
            await prisma.$transaction(async (tx) => {
                // Update contact
                const contact = await tx.contact.findUnique({ where: { id: contactId } });
                if (contact) {
                    await tx.contact.update({
                        where: { id: contactId },
                        data: {
                            status: "sent",
                            step: contact.step + 1,
                            lastSent: new Date().toISOString().replace('T', ' ').substring(0, 16)
                        }
                    });
                }

                // Update stats
                await tx.stats.update({
                    where: { id: 1 },
                    data: {
                        totalSent: { increment: 1 },
                        coldOutreach: mode === "cold" ? { increment: 1 } : undefined,
                        followUps: mode === "followup" ? { increment: 1 } : undefined,
                    }
                });
            });
        } else if (!success) {
            await prisma.stats.update({
                where: { id: 1 },
                data: { errors: { increment: 1 } }
            });
            return NextResponse.json({ error: "Failed to send SMS" }, { status: 500 });
        }

        return NextResponse.json({ success: true, isDryRun });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
