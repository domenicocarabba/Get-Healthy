export const runtime = "nodejs"; export const dynamic = "force-dynamic"; export const revalidate = 0;
import { NextResponse } from "next/server"; import { supabaseRoute } from "@/lib/ai/supabaseServer";
import { planLimit } from "@/lib/ai/plans"; import { nextCycleEnd } from "@/lib/ai/cycle";

export async function GET() {
    const supabase = supabaseRoute();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: p } = await supabase.from("profiles")
        .select("plan, token_limit, tokens_used, cycle_start").eq("id", user.id).single();

    const plan = p?.plan || "base";
    const token_limit = p?.token_limit || planLimit(plan);
    const tokens_used = p?.tokens_used || 0;
    const cycle_start = p?.cycle_start || null;
    const cycle_end = cycle_start ? nextCycleEnd(cycle_start) : null;

    return NextResponse.json({ plan, token_limit, tokens_used, cycle_start, cycle_end });
}
