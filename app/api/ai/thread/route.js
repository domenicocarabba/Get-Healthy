// /app/api/ai/thread/route.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { supabaseRoute, supabaseAdmin } from "@/lib/ai/supabaseServer";
import { normalizePlan, planLimit } from "@/lib/ai/plans";

/**
 * POST /api/ai/thread
 * Body opzionale: { title?: string }
 * Crea un nuovo thread per l'utente autenticato.
 * Inizializza anche il profilo se manca (piano base + limiti).
 */
export async function POST(req) {
    try {
        const supabase = supabaseRoute();

        // 1) Autenticazione
        const { data: { user }, error: sessErr } = await supabase.auth.getUser();
        if (sessErr) return NextResponse.json({ error: sessErr.message }, { status: 500 });
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // 2) Title opzionale dal body
        let title = "Nuova chat";
        try {
            const body = await req.json();
            if (body?.title && typeof body.title === "string") {
                const t = body.title.trim();
                if (t.length) title = t.slice(0, 120); // limite di sicurezza
            }
        } catch {
            /* body vuoto: ok */
        }

        // 3) Assicurati che esista un profilo (piano base di default)
        try {
            const { data: prof } = await supabase
                .from("profiles")
                .select("id, plan, token_limit, tokens_used, cycle_start")
                .eq("id", user.id)
                .single();

            if (!prof) {
                const admin = (typeof supabaseAdmin === "function" && supabaseAdmin()) || supabase;
                const basePlan = normalizePlan("base");
                const limit = planLimit(basePlan);
                await admin.from("profiles").insert({
                    id: user.id,
                    plan: basePlan,
                    token_limit: limit,
                    tokens_used: 0,
                    cycle_start: null, // si inizializza al primo utilizzo reale in /api/ai/chat
                });
            }
        } catch (e) {
            // non bloccare la creazione del thread se il profilo fallisce;
            // verrà (re)inizializzato alla prima chat
            console.warn("profiles init warning:", e?.message || e);
        }

        // 4) Crea il thread
        const { data, error } = await supabase
            .from("threads")
            .insert([{ user_id: user.id, title }])
            .select("id, title, created_at, updated_at")
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ thread: data }, { status: 201 });
    } catch (e) {
        console.error("POST /api/ai/thread error:", e);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
