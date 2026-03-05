export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const stats = await prisma.stats.upsert({
            where: { id: 1 },
            update: {},
            create: {
                id: 1,
                totalSent: 0,
                coldOutreach: 0,
                followUps: 0,
                errors: 0,
            },
        });
        return NextResponse.json(stats);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
