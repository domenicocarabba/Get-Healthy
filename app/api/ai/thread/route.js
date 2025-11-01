export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { supabaseRoute } from "@/lib/ai/supabaseServer";

// POST /api/ai/thread  { title?: string }
export async function POST(req) {
    try {
        const supabase = supabaseRoute();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        let title = "Nuova chat";
        try {
            const body = await req.json();
            if (body?.title && typeof body.title === "string") {
                title = body.title.trim() || title;
            }
        } catch { /* body vuoto ok */ }

        const { data, error } = await supabase
            .from("threads")
            .insert([{ user_id: user.id, title }])
            .select("id, title, created_at, updated_at")
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 400 });

        return NextResponse.json({ thread: data }, { status: 201 });
    } catch (e) {
        console.error("POST /api/ai/thread error", e);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
