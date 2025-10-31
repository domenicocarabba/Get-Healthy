// /app/api/ai/history/[threadId]/route.js
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseRoute } from "@/lib/ai/supabaseServer";

export async function GET(_req, { params }) {
    const threadId = params?.threadId;
    if (!threadId) {
        return NextResponse.json({ error: "threadId mancante" }, { status: 400 });
    }

    const supabase = supabaseRoute();
    const {
        data: { session },
        error: sessErr,
    } = await supabase.auth.getSession();

    if (sessErr) {
        return NextResponse.json({ error: `Errore sessione: ${sessErr.message}` }, { status: 500 });
    }
    if (!session?.user) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // Facoltativo: qui potresti verificare che l'utente sia owner del thread
    // con una query alla tabella "threads" (RLS dovrebbe già proteggerlo).

    const { data, error } = await supabase
        .from("ai_messages")
        .select("id, thread_id, user_id, role, content, created_at")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ messages: data || [] });
}

