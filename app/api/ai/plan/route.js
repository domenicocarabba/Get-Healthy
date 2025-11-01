export const runtime = "nodejs"; export const dynamic = "force-dynamic"; export const revalidate = 0;
import { NextResponse } from "next/server"; import { supabaseRoute, supabaseAdmin } from "@/lib/ai/supabaseServer";
import { normalizePlan, planLimit } from "@/lib/ai/plans";

export async function POST(req) {
    const supabase = supabaseRoute();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const newPlan = normalizePlan(body?.plan); const limit = planLimit(newPlan);
    const admin = supabaseAdmin?.() || supabase;

    const { data: has } = await admin.from("profiles").select("id").eq("id", user.id).single();
    if (!has) {
        const { error } = await admin.from("profiles").insert({ id: user.id, plan: newPlan, token_limit: limit, tokens_used: 0, cycle_start: null });
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    } else {
        const { error } = await admin.from("profiles").update({ plan: newPlan, token_limit: limit }).eq("id", user.id);
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true, plan: newPlan, token_limit: limit });
}
