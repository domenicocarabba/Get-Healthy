// /lib/ai/plans.js

// Limiti token mensili stimati (~parole generate)
export const PLAN_LIMITS = {
    base: 50_000,
    plus: 300_000,
    pro: 1_000_000,
};

// Normalizza nome piano (qualsiasi input → base/plus/pro)
export function normalizePlan(plan) {
    if (plan === "plus" || plan === "pro") return plan;
    return "base";
}

// Helper: limite token del piano (normalizzato)
export function planLimit(plan) {
    const p = normalizePlan(plan);
    return PLAN_LIMITS[p] ?? PLAN_LIMITS.base;
}

// Configurazione funzionalità per ciascun piano
export const PLAN = {
    base: {
        ctx: 512,
        memory: false,
        rag: false,
        autoPlan: false,
        workouts: false,
        priority: 3,
    },
    plus: {
        ctx: 1024,
        memory: true,
        rag: true,
        autoPlan: true,
        workouts: true,
        priority: 2,
    },
    pro: {
        ctx: 2048,
        memory: true,
        rag: true,
        autoPlan: true,
        workouts: true,
        priority: 1,
        adaptive: true,
        cron: true,
        export: true,
    },
};

// Informazioni testuali per UI (pagina /plan)
export const PLAN_INFO = {
    base: {
        name: "Base",
        price: "Gratis",
        features: [
            "Chat AI essenziale",
            "Risposte fino a 512 token",
            "Suggerimenti su cibo e 2–3 workout/sett.",
            "Piano base non salvato",
        ],
    },
    plus: {
        name: "Plus",
        price: "€9,90/mese",
        features: [
            "Memoria preferenze",
            "Risposte fino a 1024 token",
            "Piano settimanale unificato (cibo+workout)",
            "Lista spesa e feedback",
        ],
    },
    pro: {
        name: "Pro",
        price: "€19,90/mese",
        features: [
            "Planner adattivo e priorità massima",
            "Risposte fino a 2048 token",
            "Export PDF/CSV",
            "Refresh automatico settimanale",
        ],
    },
};
