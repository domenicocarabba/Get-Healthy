// app/api/plan/route.js
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import {
  getUser,
  getProfile,
  saveWeeklyPlan,
  getRecipesRAG,
  getWorkoutsRAG,
  getFeedbackSummary,
} from "@/lib/core";
import { geminiGenerateUnifiedPlan } from "@/lib/ai/unifiedPlan";
import { PLAN, normalizePlan } from "@/lib/ai/plans";

/* ----------------- helpers ----------------- */
function toISODate(d) {
  try { return new Date(d).toISOString().slice(0, 10); } catch { return null; }
}
function startOfWeekISO(date = new Date(), weekStartsOn = 1) {
  // weekStartsOn: 1 = Monday
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay(); // 0..6 (Sun..Sat)
  const diff = (day === 0 ? 7 : day) - weekStartsOn;
  d.setUTCDate(d.getUTCDate() - diff);
  return d.toISOString().slice(0, 10);
}
function sanitizePlan(raw) {
  const out = typeof raw === "object" && raw ? raw : {};
  const weekStart = toISODate(out.weekStart) || startOfWeekISO();
  const days = Array.isArray(out.days) ? out.days : [];

  // garantisci max 7 giorni con date ISO
  const safeDays = days
    .map((d, i) => {
      const date =
        toISODate(d?.date) ||
        toISODate(new Date(new Date(weekStart).getTime() + i * 86400000));
      return {
        date,
        workout: d?.workout ?? null,
        meals: d?.meals ?? null,
      };
    })
    .filter(d => !!d.date)
    .slice(0, 7);

  // se meno di 7, completa con placeholder
  while (safeDays.length < 7) {
    const idx = safeDays.length;
    const date = toISODate(new Date(new Date(weekStart).getTime() + idx * 86400000));
    safeDays.push({ date, workout: null, meals: null });
  }

  return { weekStart, days: safeDays };
}

/* ----------------- route handler ----------------- */
export async function POST() {
  try {
    // 1) Utente
    const user = await getUser().catch(() => null);
    if (!user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // 2) Profilo + tier
    const profile = await getProfile(user.id).catch(() => ({}));
    const planName = normalizePlan(profile?.plan);
    const tierCfg = PLAN[planName] || PLAN.base;

    // 3) Contesti (ricette/allenamenti) in parallelo
    const [recipesCtx, workoutsCtx] = await Promise.all([
      getRecipesRAG(profile).catch(() => []),
      getWorkoutsRAG(profile).catch(() => []),
    ]);

    // 4) Preferenze adattive (solo se abilitato dal piano)
    const adaptivePrefs = tierCfg.adaptive
      ? await getFeedbackSummary(user.id).catch(() => null)
      : null;

    // 5) Generazione piano (rispettando il budget del piano)
    const generated = await geminiGenerateUnifiedPlan({
      profile,
      recipesCtx,
      workoutsCtx,
      adaptivePrefs,
      maxTokens: tierCfg.ctx, // es. 512 / 1024 / 2048
    });

    // 6) Normalizza e valida
    const planJson = sanitizePlan(generated);

    // 7) Salvataggio (solo se permesso dal piano)
    let saved = false;
    if (tierCfg.autoPlan && Array.isArray(planJson.days) && planJson.days.length === 7) {
      await saveWeeklyPlan(user.id, planJson); // salva su Supabase (tabella weekly_plans)
      saved = true;
    }

    return NextResponse.json({
      ok: true,
      plan_tier: planName,
      saved,
      plan: planJson,
    });
  } catch (e) {
    console.error("POST /api/plan error:", e);
    return NextResponse.json({ error: e?.message || "Plan error" }, { status: 500 });
  }
}
