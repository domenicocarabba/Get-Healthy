import { supabaseServer } from "@/lib/supabaseServer";

export async function GET(_req, { params }) {
    const { threadId } = params;
    const supabase = supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

    const { data, error } = await supabase
        .from("ai_messages")
        .select("*")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });

    if (error) return Response.json({ error: error.message }, { status: 400 });
    return Response.json({ messages: data });
}
