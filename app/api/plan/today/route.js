// app/api/plan/today/route.js
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/ai/supabaseServer";

function iso(d) {
  // ritorna YYYY-MM-DD (UTC) per confronti consistenti
  return new Date(d).toISOString().slice(0, 10);
}
function daysDiff(fromISO, toISO) {
  const a = new Date(fromISO + "T00:00:00Z").getTime();
  const b = new Date(toISO + "T00:00:00Z").getTime();
  return Math.floor((b - a) / 86400000);
}

export async function GET() {
  try {
    const sb = supabaseServer();
    const { data: { session } } = await sb.auth.getSession();
    const user = session?.user;
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { data: row, error } = await sb
      .from("weekly_plans")
      .select("*")
      .eq("user_id", user.id)
      .order("week_start", { ascending: false })
      .limit(1)
      .maybeSingle(); // meglio di .single() quando può non esistere

    if (error || !row) {
      return NextResponse.json({ today: null, reason: "no_weekly_plan" });
    }

    // plan_json o plan possono essere stringhe → parse sicuro
    const rawPlan = row.plan_json ?? row.plan ?? {};
    let plan = rawPlan;
    if (typeof rawPlan === "string") {
      try { plan = JSON.parse(rawPlan); } catch { plan = {}; }
    }

    const days = Array.isArray(plan.days) ? plan.days : [];
    const weekStartRaw = plan.weekStart || row.week_start || iso(new Date());
    const weekStartISO = String(weekStartRaw).slice(0, 10);
    const todayISO = iso(new Date());

    let today = days.find(d => d?.date && d.date.slice(0, 10) === todayISO) || null;
    if (!today && days.length) {
      const idx = Math.max(0, Math.min(6, daysDiff(weekStartISO, todayISO)));
      today = days[idx] || null;
    }

    return NextResponse.json({ today, weekStart: weekStartISO, planId: row.id });
  } catch (e) {
    console.error("GET /api/plan/today error:", e);
    return NextResponse.json({ error: e.message || "internal_error" }, { status: 500 });
  }
}
