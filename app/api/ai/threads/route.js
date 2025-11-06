export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { supabaseRoute } from "@/lib/ai/supabaseServer";

export async function GET() {
    try {
        const supabase = supabaseRoute();

        const { data: { user }, error: sessErr } = await supabase.auth.getUser();
        if (sessErr) return NextResponse.json({ error: `Errore sessione: ${sessErr.message}` }, { status: 500 });
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { data: threads, error } = await supabase
            .from("threads")
            .select("id, title, created_at, updated_at")
            .eq("user_id", user.id)
            .order("updated_at", { ascending: false });

        if (error) return NextResponse.json({ error: error.message }, { status: 400 });

        return NextResponse.json({ threads: threads || [] });
    } catch (e) {
        console.error("GET /api/ai/threads error:", e);
        return NextResponse.json({ error: "Errore interno" }, { status: 500 });
    }
}
