export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { supabaseRoute } from "@/lib/ai/supabaseServer";
import { normalizePlan, PLAN_LIMITS } from "@/lib/ai/plans";

export async function POST(req) {
    try {
        const supabase = supabaseRoute();

        const { data: { user }, error: sessErr } = await supabase.auth.getUser();
        if (sessErr) return NextResponse.json({ error: sessErr.message }, { status: 500 });
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // title opzionale
        let title = "Nuova chat";
        try {
            const body = await req.json();
            if (body?.title && typeof body.title === "string") {
                const t = body.title.trim();
                if (t) title = t.slice(0, 120);
            }
        } catch { /* body vuoto ok */ }

        // assicurati che esista un profilo
        try {
            const { data: prof } = await supabase
                .from("profiles")
                .select("id, plan, token_limit, tokens_used, cycle_start")
                .eq("id", user.id)
                .single();

            if (!prof) {
                const plan = normalizePlan("base");
                const limit = PLAN_LIMITS[plan];
                await supabase.from("profiles").insert({
                    id: user.id, plan, token_limit: limit, tokens_used: 0, cycle_start: null
                });
            }
        } catch (e) {
            console.warn("profiles init warning:", e?.message || e);
        }

        const { data, error } = await supabase
            .from("threads")
            .insert([{ user_id: user.id, title }])
            .select("id, title, created_at, updated_at")
            .single();

        if (error) {
            console.error("Supabase insert threads error:", error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ thread: data }, { status: 201 });
    } catch (e) {
        console.error("POST /api/ai/thread error:", e);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
