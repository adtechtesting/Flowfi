

import { NextResponse } from "next/server";

export async function POST(req: Request) {
    if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Not available" }, { status: 403 });
    }

    const rawBody = await req.text();
    const headers: Record<string, string> = {};

    req.headers.forEach((value, key) => {
        headers[key] = value;
    });

    let parsed: any = null;
    try { parsed = JSON.parse(rawBody); } catch { }

    console.log("=== DODO WEBHOOK DEBUG ===");
    console.log("Headers:", JSON.stringify(headers, null, 2));
    console.log("Body:", JSON.stringify(parsed, null, 2));
    console.log("=========================");

    return NextResponse.json({
        received: true,
        headers,
        body: parsed,
    });
}