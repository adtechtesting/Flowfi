

import { NextResponse } from "next/server";

export async function POST(req: Request) {
    if (process.env.NODE_ENV === "production") {
        return new NextResponse(null, { status: 404 });
    }

    const rawBody = await req.text();
    const headers: Record<string, string> = {};

    req.headers.forEach((value, key) => {
        headers[key] = value;
    });

    let parsed: any = null;
    try { parsed = JSON.parse(rawBody); } catch { }

    return NextResponse.json({
        received: true,
        headers,
        body: parsed,
    });
}