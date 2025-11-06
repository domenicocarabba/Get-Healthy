import { supabaseServer } from "@/lib/ai/supabaseServer.js";
import { geminiGenerateUnifiedPlan } from "@/lib/ai/unifiedPlan.js";
import { getRecipesRAG, getWorkoutsRAG } from "@/lib/core.js";
import { PLAN } from "@/lib/ai/plans.js";

const CRON_SECRET = process.env.CRON_SECRET || "";

export async function GET(req) {
  // sicurezza semplice via header
  const auth = req.headers.get("x-cron-key") || "";
  if (!CRON_SECRET || auth !== CRON_SECRET) {
    return new Response("forbidden", { status: 403 });
  }

  const sb = supabaseServer();
  // prendi utenti Pro
  const { data: users, error } = await sb
    .from("profiles")
    .select("id, plan")
    .eq("plan", "pro");
  if (error) return new Response(error.message, { status: 500 });

  let ok = 0, fail = 0;

  for (const u of users || []) {
    try {
      const { data: profile } = await sb.from("profiles").select("*").eq("id", u.id).single();
      // raccogli contesti
      const [recipesCtx, workoutsCtx] = await Promise.all([
        getRecipesRAG(profile),
        getWorkoutsRAG(profile),
      ]);
      // genera
      const plan = await geminiGenerateUnifiedPlan({ profile, recipesCtx, workoutsCtx });
      if (plan?.days?.length) {
        await sb.from("weekly_plans").insert({
          user_id: u.id,
          week_start: plan.weekStart || new Date().toISOString().slice(0, 10),
          plan_json: plan,
        });
        ok++;
      } else {
        fail++;
      }
    } catch {
      fail++;
    }
  }

  return Response.json({ ok, fail, total: (users || []).length });
}
