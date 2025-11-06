// app/api/history/route.ts
import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { cookies } from "next/headers";

function monthKey(d = new Date()) {
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function GET() {
    const uid = cookies().get("gh_uid")?.value;
    if (!uid) return NextResponse.json({ items: [] });

    const hk = `hist:${uid}:${monthKey()}`;
    const raw = await kv.lrange<string>(hk, -100, -1);
    const items = raw.map((s) => {
        try {
            return JSON.parse(s);
        } catch {
            return { ts: 0, role: "unknown", text: s };
        }
    });
    return NextResponse.json({ items });
}
