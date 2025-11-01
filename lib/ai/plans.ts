// /lib/ai/plans.js
// Definizione limiti token mensili e helper piano utente

export const PLAN_LIMITS = {
    base: 50_000,     // token mensili stimati (~12.5k parole)
    plus: 300_000,
    pro: 1_000_000,
};

/**
 * Normalizza un nome piano — se non riconosciuto, ritorna 'base'
 */
export function normalizePlan(plan) {
    if (plan === "plus" || plan === "pro") return plan;
    return "base";
}

/**
 * Ritorna il limite token mensile per il piano dato
 */
export function planLimit(plan) {
    return PLAN_LIMITS[normalizePlan(plan)] || PLAN_LIMITS.base;
}

/**
 * (Facoltativo) Ritorna la descrizione visiva del piano
 */
export function planName(plan) {
    const names = {
        base: "Base",
        plus: "Plus",
        pro: "Pro",
    };
    return names[normalizePlan(plan)] || "Base";
}

/**
 * (Facoltativo) Tabella descrittiva se ti serve nel pricing o profilo
 */
export const PLAN_INFO = {
    base: {
        name: "Base",
        price: "Gratis",
        tokens: "50 000/mese",
        features: [
            "Risposte testuali base",
            "Accesso al modello Gemini 1.5 Flash",
            "Limite di 50 000 token al mese",
        ],
    },
    plus: {
        name: "Plus",
        price: "€9,90/mese",
        tokens: "300 000/mese",
        features: [
            "Risposte più lunghe e dettagliate",
            "Gemini 1.5 Flash + ChatGPT",
            "Limite di 300 000 token al mese",
        ],
    },
    pro: {
        name: "Pro",
        price: "€29,90/mese",
        tokens: "1 000 000/mese",
        features: [
            "Accesso completo a tutti i modelli AI",
            "Priorità e latenza ridotta",
            "Limite di 1 000 000 token al mese",
        ],
    },
};
