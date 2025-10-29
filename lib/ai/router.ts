// lib/ai/router.ts
import { askGeminiMM, PLAN_LIMITS, type Plan } from "./providers";

// Unisci system + prompt
function buildSystem(): string {
    return "Rispondi in modo chiaro, utile e conciso. Se chiedono consigli su salute/nutrizione, specifica che non sostituisci un professionista sanitario.";
}

export async function routeByPlan({
    plan,
    prompt,
    images,
    prefs,
}: {
    plan: Plan;
    prompt: string;
    images?: string[]; // dataURL/base64
    prefs?: Record<string, unknown>;
}) {
    const system = buildSystem();
    const userText = prefs
        ? `${prompt}\n\n[Preferenze utente]: ${JSON.stringify(prefs)}`
        : prompt;

    const maxOutputTokens = PLAN_LIMITS[plan];

    return askGeminiMM({
        userText,
        system,
        images,
        maxOutputTokens,
    });
}
