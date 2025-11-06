import { NextResponse } from "next/server";
import { supabaseRoute, supabaseAdmin } from "@/lib/ai/supabaseServer";

export const dynamic = "force-dynamic";

export async function POST() {
    const sb = supabaseRoute();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        // 1) opzionale: elimina file su Storage se usi bucket (aggiungi qui cleanup)

        // 2) elimina l’utente (richiede service role)
        const admin = supabaseAdmin?.();
        if (!admin) return NextResponse.json({ error: "Service role non configurato" }, { status: 500 });

        const { error: delErr } = await admin.auth.admin.deleteUser(user.id);
        if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

        // 3) cookie/sessione saranno invalidate comunque
        return NextResponse.json({ ok: true });
    } catch (e) {
        return NextResponse.json({ error: e.message || "Errore cancellazione" }, { status: 500 });
    }
}
