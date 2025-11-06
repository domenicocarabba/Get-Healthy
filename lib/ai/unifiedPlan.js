// lib/ai/unifiedPlan.js
import { askGeminiMM } from "./providers.js";

/**
 * Converte profilo + contesti in un unico payload compatto per il prompt.
 */
function buildUserPayload(profile, recipesCtx, workoutsCtx, adaptivePrefs) {
    return {
        profile: {
            sex: profile?.sex,
            height_cm: profile?.height_cm,
            weight_kg: profile?.weight_kg,
            activity_level: profile?.activity_level,
            goal: profile?.goal,
            workout_days: profile?.workout_days || 3,
            workout_time_pref: profile?.workout_time_pref || 30,
            available_equipment: profile?.available_equipment || [],
            intolerances: { lactose_free: !!profile?.lactose_free },
            low_gi: !!profile?.low_gi,
            kcal_target: profile?.kcal_target || 2000,
            macro_target: profile?.macro_target || { c: 50, p: 30, f: 20 },
        },
        recipesCtx: Array.isArray(recipesCtx) ? recipesCtx.slice(0, 200) : [],
        workoutsCtx: Array.isArray(workoutsCtx) ? workoutsCtx.slice(0, 200) : [],
        adaptivePrefs: adaptivePrefs || null, // opzionale: usato solo per Pro
    };
}

/**
 * Pulisce testo in blocchi ```json ... ``` o ``` ... ```
 */
function stripCodeFence(s) {
    if (!s) return "";
    let t = String(s).trim();
    // ```json ... ```
    t = t.replace(/^```json\s*/i, "").replace(/```$/i, "");
    // ``` ... ```
    t = t.replace(/^```\s*/i, "").replace(/```$/i, "");
    return t.trim();
}

/**
 * Genera un piano unificato (cibo + workout).
 * - profile: profilo utente (Supabase)
 * - recipesCtx / workoutsCtx: liste candidate per RAG/filtri
 * - adaptivePrefs: riassunto feedback (solo Pro) — opzionale
 * - maxTokens: override limite output (se non passato, default 1400)
 */
export async function geminiGenerateUnifiedPlan({
    profile,
    recipesCtx,
    workoutsCtx,
    adaptivePrefs,
    maxTokens,
}) {
    const system =
        [
            "Sei un pianificatore salute (cibo + allenamenti).",
            "Restituisci **SOLO JSON** valido (nessun commento o testo extra).",
            "",
            "Schema atteso `WeeklyPlan`:",
            "{",
            '  "userId": string,',
            '  "weekStart": "YYYY-MM-DD",',
            '  "kCalTarget": number,',
            '  "macroTarget": { "c": number, "p": number, "f": number },',
            '  "days": [',
            "    {",
            '      "date": "YYYY-MM-DD",',
            '      "meals": {',
            '        "breakfast"?: Meal, "lunch"?: Meal, "snack"?: Meal, "dinner"?: Meal',
            "      },",
            '      "workout"?: { "id": string, "title": string, "estTime": number, "focus": string[] }',
            "    }",
            "  ]",
            "}",
            "Meal: { id?: string, title: string, kcal: number, macros: { c:number, p:number, f:number }, gi?: 'low'|'med' }",
            "",
            "Regole:",
            "- Rispetta il tempo preferito per allenamento (`workout_time_pref`).",
            "- Se allenamento ≥ 40′, aumenta le proteine nel pasto post-workout.",
            "- Se `low_gi` true → scegli ricette a basso indice glicemico.",
            "- Se `intolerances.lactose_free` true → evita lattosio.",
            "- Usa solo esercizi compatibili con l’attrezzatura disponibile.",
            "- Se presenti `adaptivePrefs`, spingi preferenze simili ai like e riduci quelle con dislike.",
        ].join("\n");

    const payload = buildUserPayload(profile, recipesCtx, workoutsCtx, adaptivePrefs);
    const userText =
        "Genera un WeeklyPlan coerente con il seguente contesto JSON:\n" +
        JSON.stringify(payload);

    const reply = await askGeminiMM({
        system,
        userText,
        temperature: 0.3,
        maxOutputTokens: typeof maxTokens === "number" ? maxTokens : 1400,
    });

    // Parsing robusto
    let plan;
    try {
        const cleaned = stripCodeFence(reply);
        plan = JSON.parse(cleaned);
    } catch {
        // fallback: struttura minima per non rompere i consumer
        plan = {
            userId: profile?.user_id || profile?.id || "unknown",
            weekStart: new Date().toISOString().slice(0, 10),
            kCalTarget: profile?.kcal_target || 2000,
            macroTarget: profile?.macro_target || { c: 50, p: 30, f: 20 },
            days: [],
        };
    }
    return plan;
}
