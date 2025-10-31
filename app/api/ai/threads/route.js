// /app/api/ai/threads/route.js
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseRoute } from "@/lib/ai/supabaseServer";

/**
 * GET /api/ai/threads
 * Ritorna la lista dei thread dell'utente autenticato
 */
export async function GET() {
    try {
        const supabase = supabaseRoute();
        const {
            data: { session },
            error: sessErr,
        } = await supabase.auth.getSession();

        if (sessErr) {
            return NextResponse.json({ error: `Errore sessione: ${sessErr.message}` }, { status: 500 });
        }
        if (!session?.user) {
            return NextResponse.json({ error: "Auth session missing" }, { status: 401 });
        }

        const userId = session.user.id;

        // Modella la tua tabella "threads" come preferisci (id, user_id, title, created_at, updated_at, ...)
        const { data: threads, error } = await supabase
            .from("threads")
            .select("id, title, created_at, updated_at")
            .eq("user_id", userId)
            .order("updated_at", { ascending: false })
            .order("created_at", { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ threads: threads || [] });
    } catch (e) {
        console.error("GET /threads error:", e);
        return NextResponse.json({ error: "Errore interno" }, { status: 500 });
    }
}

/**
 * POST /api/ai/threads
 * Crea un nuovo thread e lo ritorna
 * Body opzionale: { title?: string }
 */
export async function POST(req) {
    try {
        const supabase = supabaseRoute();
        const {
            data: { session },
            error: sessErr,
        } = await supabase.auth.getSession();

        if (sessErr) {
            return NextResponse.json({ error: `Errore sessione: ${sessErr.message}` }, { status: 500 });
        }
        if (!session?.user) {
            return NextResponse.json({ error: "Auth session missing" }, { status: 401 });
        }

        const userId = session.user.id;
        let title = "Nuova chat";
        try {
            const body = await req.json();
            if (body?.title && typeof body.title === "string") {
                title = body.title.trim() || title;
            }
        } catch {
            // body vuoto → ok
        }

        const { data, error } = await supabase
            .from("threads")
            .insert([{ user_id: userId, title }])
            .select("id, title, created_at, updated_at")
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ thread: data }, { status: 201 });
    } catch (e) {
        console.error("POST /threads error:", e);
        return NextResponse.json({ error: "Errore interno" }, { status: 500 });
    }
}
