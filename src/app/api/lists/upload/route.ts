export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const { name, contacts } = await req.json();

        if (!name || !contacts || !Array.isArray(contacts)) {
            return NextResponse.json({ error: "Invalid data format. Name and contacts array are required." }, { status: 400 });
        }

        if (contacts.length === 0) {
            return NextResponse.json({ error: "The provided CSV is empty." }, { status: 400 });
        }

        const sample = contacts[0];
        const phoneKey = Object.keys(sample).find(k => k.toLowerCase() === 'phone' || k.toLowerCase().includes('number'));

        if (!phoneKey) {
            return NextResponse.json({ error: "No 'phone' column found in CSV. Expected header 'phone'." }, { status: 400 });
        }

        const listCount = await prisma.list.count();
        const isActive = listCount === 0;

        // Perform in a transaction for atomicity
        const result = await prisma.$transaction(async (tx: any) => {
            const list = await tx.list.create({
                data: {
                    name,
                    isActive,
                }
            });

            const contactsToCreate = contacts.map((c: Record<string, any>) => {
                // Find keys case-insensitively
                const getVal = (possibleKeys: string[]) => {
                    const key = Object.keys(c).find(k =>
                        possibleKeys.some(pk => k.toLowerCase() === pk.toLowerCase())
                    );
                    return key ? c[key] : null;
                };

                const rawPhone = String(getVal(['phone', 'number', 'mobile']) || "");
                const cleanPhone = rawPhone.replace(/[^\d+]/g, "");

                const rawStep = getVal(['step', 'sequence']);
                const stepValue = parseInt(String(rawStep ?? 0));

                const rawLastSent = getVal(['last_sent', 'lastSent', 'last_contacted']);
                const statusValue = getVal(['status', 'state']);
                const blacklistedValue = getVal(['blacklisted', 'blocked']);

                return {
                    listId: list.id,
                    phone: cleanPhone || "invalid",
                    status: statusValue ? String(statusValue) : null,
                    step: isNaN(stepValue) ? 0 : stepValue,
                    lastSent: rawLastSent ? String(rawLastSent) : null,
                    blacklisted: blacklistedValue ? String(blacklistedValue) : null,
                };
            });

            // SQLite parameter limit is usually around 999 or 32766 depending on version
            // We'll chunk to be safe and efficient
            const CHUNK_SIZE = 500;
            for (let i = 0; i < contactsToCreate.length; i += CHUNK_SIZE) {
                const chunk = contactsToCreate.slice(i, i + CHUNK_SIZE);
                await tx.contact.createMany({
                    data: chunk
                });
            }

            return list;
        }, {
            timeout: 60000 // Increased timeout for mapping larger lists
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("BATCH_UPLOAD_ERROR:", error);
        return NextResponse.json({
            error: "Injection failed",
            details: error?.message || "Internal Server Error"
        }, { status: 500 });
    }
}
