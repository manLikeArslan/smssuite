export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const mode = searchParams.get("mode"); // 'cold' | 'followup'
        const countOnly = searchParams.get("countOnly") === "true";
        const skip = parseInt(searchParams.get("skip") || "0");
        const take = parseInt(searchParams.get("take") || "100");

        const activeList = await prisma.list.findFirst({
            where: { isActive: true }
        });

        if (!activeList) {
            return NextResponse.json({ error: "No active list selected" }, { status: 400 });
        }

        if (mode === "cold") {
            const where = {
                listId: activeList.id,
                AND: [
                    {
                        OR: [
                            { status: null },
                            { status: { not: "sent" } },
                            { step: 0 }
                        ]
                    },
                    {
                        OR: [
                            { blacklisted: null },
                            { blacklisted: { not: "True" } }
                        ]
                    }
                ]
            };

            if (countOnly) {
                const count = await prisma.contact.count({ where });
                return NextResponse.json({ count });
            }

            const targets = await prisma.contact.findMany({
                where,
                skip,
                take,
                select: { id: true, phone: true, status: true }
            });

            return NextResponse.json({ targets });

        } else if (mode === "followup") {
            const threeDaysAgo = new Date();
            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
            const dateStr = threeDaysAgo.toISOString().replace('T', ' ').substring(0, 16);

            const where = {
                listId: activeList.id,
                status: "sent",
                step: { gte: 1 },
                lastSent: {
                    lte: dateStr
                }
            };

            if (countOnly) {
                const count = await prisma.contact.count({ where });
                return NextResponse.json({ count });
            }

            const targets = await prisma.contact.findMany({
                where,
                skip,
                take,
                select: { id: true, phone: true, status: true }
            });

            return NextResponse.json({ targets });
        } else {
            return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
        }

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch targets" }, { status: 500 });
    }
}
