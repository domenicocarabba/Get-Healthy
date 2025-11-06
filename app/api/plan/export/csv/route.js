import { supabaseServer } from "@/lib/ai/supabaseServer.js";
import { normalizePlan, PLAN } from "@/lib/ai/plans.js";

function csvEscape(s) {
  if (s == null) return "";
  const t = String(s).replace(/"/g, '""');
  return /[",\n]/.test(t) ? `"${t}"` : t;
}

export async function GET() {
  const sb = supabaseServer();
  const { data: { session } } = await sb.auth.getSession();
  if (!session?.user) return new Response("unauthorized", { status: 401 });
  const uid = session.user.id;

  const { data: prof } = await sb.from("profiles").select("*").eq("id", uid).single();
  const plan = normalizePlan(prof?.plan);
  if (!PLAN[plan].export) return new Response("export not allowed for this plan", { status: 403 });

  const { data: row } = await sb
    .from("weekly_plans")
    .select("*")
    .eq("user_id", uid)
    .order("week_start", { ascending: false })
    .limit(1).single();
  if (!row) return new Response("no plan", { status: 404 });

  const planJson = row.plan_json || row.plan || {};
  const lines = [];
  lines.push(["date", "slot", "title", "kcal", "carbs", "protein", "fat", "workout", "workout_time"].map(csvEscape).join(","));

  for (const d of planJson.days || []) {
    const date = d?.date || "";
    const meals = d?.meals || {};
    const keys = ["breakfast", "lunch", "snack", "dinner"];
    for (const k of keys) {
      const m = meals[k];
      if (!m) continue;
      lines.push([
        date, k, m.title, m.kcal ?? "", m?.macros?.c ?? "", m?.macros?.p ?? "", m?.macros?.f ?? "",
        "", ""
      ].map(csvEscape).join(","));
    }
    if (d?.workout) {
      lines.push([
        date, "", "", "", "", "", "",
        d.workout.title, d.workout.estTime ?? ""
      ].map(csvEscape).join(","));
    }
  }

  const body = lines.join("\n");
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="weekly-plan-${row.week_start}.csv"`,
    }
  });
}
