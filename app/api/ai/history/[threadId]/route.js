export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { supabaseRoute } from "@/lib/ai/supabaseServer";

export async function GET(_req, { params }) {
    const supabase = supabaseRoute();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const threadId = params.threadId;

    // sicuro che il thread è tuo
    const { data: thread, error: thErr } = await supabase
        .from("threads")
        .select("id")
        .eq("id", threadId)
        .eq("user_id", user.id)
        .single();

    if (thErr || !thread) {
        return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    const { data: messages, error } = await supabase
        .from("messages")
        .select("id, role, content, created_at")
        .eq("thread_id", threadId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ messages: messages || [] });
}
