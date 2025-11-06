// /app/api/ai/usage/route.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { supabaseRoute } from "@/lib/ai/supabaseServer.js";
import { PLAN_LIMITS, normalizePlan } from "@/lib/ai/plans.js";
import { nextCycleEnd } from "@/lib/ai/cycle.js";

export async function GET() {
    const supabase = supabaseRoute();
    const { data: { user } = {} } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: p, error } = await supabase
        .from("profiles")
        .select("plan, token_limit, tokens_used, cycle_start")
        .eq("id", user.id)
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const planName = normalizePlan(p?.plan || "base");

    // Limite mensile: se non presente in DB, usa quello di default del piano
    const token_limit = Number(p?.token_limit ?? PLAN_LIMITS[planName]);
    const tokens_used = Number(p?.tokens_used ?? 0);
    const cycle_start = p?.cycle_start || null;
    const cycle_end = cycle_start ? nextCycleEnd(cycle_start) : null;

    return NextResponse.json({
        plan: planName,
        token_limit,
        tokens_used,
        cycle_start,
        cycle_end,
    });
}
