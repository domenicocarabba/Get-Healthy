// lib/ai/router.ts
import { askGemini, PLAN_LIMITS, type Plan } from "./providers";

// Unisci system + prompt in un'unica stringa
function buildPrompt(system: string, userPrompt: string) {
    return `${system}\n\nUtente: ${userPrompt}`;
}

export async function routeByPlan({
    plan,
    prompt,
}: {
    plan: Plan;
    prompt: string;
}) {
    const system =
        "Rispondi in modo chiaro, utile e conciso. Se chiedono consigli su salute/nutrizione, specifica che non sostituisci un professionista sanitario.";

    const full = buildPrompt(system, prompt);
    const maxOutputTokens = PLAN_LIMITS[plan];

    return askGemini(full, { maxOutputTokens });
}

