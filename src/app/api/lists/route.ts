export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const lists = await prisma.list.findMany({
            include: {
                _count: {
                    select: { contacts: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        const listsWithStats = await Promise.all(lists.map(async (list) => {
            const [sent, followUps] = await Promise.all([
                prisma.contact.count({
                    where: { listId: list.id, step: { gt: 0 } }
                }),
                prisma.contact.count({
                    where: { listId: list.id, step: { gt: 1 } }
                })
            ]);

            return {
                ...list,
                contacts: undefined, // Remove the contacts array field entirely
                stats: {
                    sent,
                    followUps,
                    remaining: list._count.contacts - sent
                }
            };
        }));

        return NextResponse.json(listsWithStats);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch lists" }, { status: 500 });
    }
}
