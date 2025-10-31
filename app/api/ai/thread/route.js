import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/ai/supabaseServer";

export async function POST() {
    try {
        const supabase = supabaseServer();

        // Recupera l’utente loggato
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
            console.error("Errore autenticazione Supabase:", userError);
            return NextResponse.json({ error: userError.message }, { status: 401 });
        }

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Crea un nuovo thread per l’utente
        const { data, error } = await supabase
            .from("ai_threads")
            .insert({
                user_id: user.id,
                title: "Nuova chat",
            })
            .select()
            .single();

        if (error) {
            console.error("Errore inserimento ai_threads:", error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        // Restituisce il nuovo thread creato
        return NextResponse.json({ thread: data }, { status: 201 });
    } catch (err) {
        console.error("Crash /api/ai/thread POST:", err);
        return NextResponse.json(
            { error: String(err?.message || err) },
            { status: 500 }
        );
    }
}
