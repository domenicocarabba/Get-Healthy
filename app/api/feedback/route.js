// app/api/feedback/route.js
import { supabaseServer } from "@/lib/ai/supabaseServer.js";
import { getUser } from "@/lib/core.js";

export async function POST(req) {
    try {
        const user = await getUser();
        const { item_type, item_id, value, reason } = await req.json();

        const sb = supabaseServer();
        const { error } = await sb.from("ai_feedback").insert({
            user_id: user.id,
            item_type,
            item_id,
            value,
            reason: reason || null,
        });
        if (error) throw error;

        return Response.json({ ok: true });
    } catch (e) {
        console.error(e);
        return new Response(JSON.stringify({ error: e.message || "Feedback error" }), { status: 500 });
    }
}
