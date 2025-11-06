// lib/core.js
import { supabaseServer } from "@/lib/ai/supabaseServer.js";
import { normalizePlan, PLAN } from "@/lib/ai/plans.js";

export async function getUser() {
  const sb = supabaseServer();
  const { data: { session } } = await sb.auth.getSession();
  if (!session?.user) throw new Error("Not authenticated");
  return session.user;
}

export async function getProfile(userId) {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("user_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();
  if (error) throw error;
  const plan = normalizePlan(data?.plan);
  return { ...data, plan, planCaps: PLAN[plan] };
}

export async function saveWeeklyPlan(userId, plan) {
  const sb = supabaseServer();
  const payload = {
    user_id: userId,
    week_start: plan.weekStart || new Date().toISOString().slice(0, 10),
    plan_json: plan,
    created_at: new Date().toISOString(),
  };
  const { error } = await sb.from("weekly_plans").insert(payload);
  if (error) throw error;
  return true;
}

// ---- Mock RAG minimi (puoi evolvere in seguito)
export async function getRecipesRAG(profile) {
  const sb = supabaseServer();
  let q = sb.from("recipes").select("*").limit(200);
  if (profile?.lactose_free) q = q.eq("lactose_free", true);
  if (profile?.low_gi) q = q.lte("gi", 55);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function getWorkoutsRAG(profile) {
  const sb = supabaseServer();
  let q = sb.from("exercise_library").select("*").limit(200);
  // esempio: se ci sono infortuni, escludi esercizi con quelle controindicazioni
  if (Array.isArray(profile?.injuries) && profile.injuries.length) {
    // NOTA: adatta questa parte alla tua struttura/estensioni PG
    // qui usiamo un or "negativo" semplificato come placeholder
    // (meglio fare un filtro server-side nella tua funzione SQL/edge)
  }
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}
// --- ADAPTIVE: riassume i feedback recenti (ultimi 60 giorni)
export async function getFeedbackSummary(userId) {
  const sb = supabaseServer();
  const since = new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString();

  const { data, error } = await sb
    .from("ai_feedback")
    .select("item_type,item_id,value,reason,created_at")
    .eq("user_id", userId)
    .gte("created_at", since)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const summary = {
    likes: [],
    dislikes: [],
    counts: { recipe: { up: 0, down: 0 }, workout: { up: 0, down: 0 } },
  };

  for (const f of data || []) {
    if (f.value > 0) {
      summary.likes.push({ type: f.item_type, id: f.item_id });
      if (f.item_type === "recipe") summary.counts.recipe.up++;
      if (f.item_type === "workout") summary.counts.workout.up++;
    } else {
      summary.dislikes.push({
        type: f.item_type,
        id: f.item_id,
        reason: f.reason,
      });
      if (f.item_type === "recipe") summary.counts.recipe.down++;
      if (f.item_type === "workout") summary.counts.workout.down++;
    }
  }

  return summary;
}


