export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { supabaseRoute } from "@/lib/ai/supabaseServer";

export async function GET(req) {
    try {
        const supabase = supabaseRoute();
        const { searchParams } = new URL(req.url);
        const thread_id = searchParams.get("thread_id");

        const { data: { user }, error: sessErr } = await supabase.auth.getUser();
        if (sessErr) return NextResponse.json({ error: sessErr.message }, { status: 500 });
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (!thread_id) return NextResponse.json({ error: "thread_id mancante" }, { status: 400 });

        const { data: rows, error } = await supabase
            .from("messages")
            .select("id, role, content, created_at")
            .eq("thread_id", thread_id)
            .order("created_at", { ascending: true })
            .limit(200);

        if (error) return NextResponse.json({ error: error.message }, { status: 400 });

        return NextResponse.json({ messages: rows || [] }, { status: 200 });
    } catch (e) {
        console.error("GET /api/ai/messages error:", e);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
