export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const listId = params.id;

        // Reset all contacts in this list to Step 0 and null status
        await prisma.contact.updateMany({
            where: { listId },
            data: {
                status: null,
                step: 0,
                lastSent: null
            }
        });

        return NextResponse.json({ success: true, message: "List progress reset to Cold state" });
    } catch (error) {
        console.error("RESET_ERROR:", error);
        return NextResponse.json({ error: "Failed to reset list progress" }, { status: 500 });
    }
}
