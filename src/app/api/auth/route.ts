import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
    try {
        const { password } = await req.json();

        const APP_PASSWORD = process.env.APP_PASSWORD || "admin";

        if (password === APP_PASSWORD) {
            // Generate a deterministic auth token from the password
            const authToken = btoa(APP_PASSWORD + "sms-suite-salt").substring(0, 32);

            const cookieStore = await cookies();
            cookieStore.set("auth_token", authToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 60 * 60 * 24 * 7, // 1 week
                path: "/",
            });

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    } catch (error) {
        return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
    }
}
