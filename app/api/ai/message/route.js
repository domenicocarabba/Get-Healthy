export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { supabaseRoute } from "@/lib/ai/supabaseServer";
import { generateWithHistory } from "@/lib/ai/gemini";
import { normalizePlan, PLAN_LIMITS } from "@/lib/ai/plans";

export async function POST(req) {
    try {
        const supabase = supabaseRoute();

        // auth
        const { data: { user }, error: sessErr } = await supabase.auth.getUser();
        if (sessErr) return NextResponse.json({ error: sessErr.message }, { status: 500 });
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // body
        const body = await req.json().catch(() => ({}));
        const { thread_id, content } = body || {};
        if (!thread_id || !content?.trim())
            return NextResponse.json({ error: "thread_id e content obbligatori" }, { status: 400 });

        // profilo e limiti
        const { data: prof } = await supabase
            .from("profiles")
            .select("plan, token_limit, tokens_used")
            .eq("id", user.id)
            .single();

        const plan = normalizePlan(prof?.plan || "base");
        const limit = prof?.token_limit ?? PLAN_LIMITS[plan];
        const used = prof?.tokens_used ?? 0;

        if (used >= limit) {
            return NextResponse.json({ error: "Limite token mensile raggiunto." }, { status: 402 });
        }

        // salva messaggio utente
        const { data: msgUser, error: insUserErr } = await supabase
            .from("messages")
            .insert({
                thread_id,
                user_id: user.id,
                role: "user",
                content: content.trim(),
            })
            .select("id, role, content, created_at")
            .single();
        if (insUserErr) return NextResponse.json({ error: insUserErr.message }, { status: 400 });

        // carica history (ultimi 30)
        const { data: history, error: histErr } = await supabase
            .from("messages")
            .select("role, content, created_at")
            .eq("thread_id", thread_id)
            .order("created_at", { ascending: true })
            .limit(30);
        if (histErr) return NextResponse.json({ error: histErr.message }, { status: 400 });

        // prompt di sistema
        const systemPrompt = [
            "Sei Get Healthy AI.",
            "Fornisci piani pasto, ricette e allenamenti personalizzati in italiano.",
            "Stile conciso, empatico e pratico. Evita diagnosi mediche.",
        ].join("\n");

        // Gemini
        const { text: assistantText, usage } = await generateWithHistory({
            system: systemPrompt,
            messages: history,
        });

        // salva risposta
        const { data: msgBot, error: insBotErr } = await supabase
            .from("messages")
            .insert({
                thread_id,
                user_id: user.id,
                role: "assistant",
                content: assistantText || "…",
            })
            .select("id, role, content, created_at")
            .single();
        if (insBotErr) return NextResponse.json({ error: insBotErr.message }, { status: 400 });

        // aggiorna contatore token
        const delta = Number(usage?.totalTokenCount || 0);
        if (delta > 0) {
            await supabase
                .from("profiles")
                .update({ tokens_used: used + delta })
                .eq("id", user.id);
        }

        return NextResponse.json({ user: msgUser, assistant: msgBot, usage }, { status: 200 });
    } catch (e) {
        console.error("POST /api/ai/message error:", e);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
