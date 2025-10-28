// lib/ai/router.ts
import { askGemini, askOpenAI, askPerplexity } from "./providers";

export type Plan = "base" | "plus" | "pro";

// Unisci system + prompt in un'unica stringa per i provider
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
        "Rispondi in modo chiaro, utile e conciso. Se chiedono consigli su salute/nutrizione, spiega che non sostituisci un professionista sanitario.";

    const full = buildPrompt(system, prompt);

    if (plan === "base") {
        // Solo Gemini
        return await askGemini(full);
    }

    if (plan === "plus") {
        // Se sembra richiesta “web/attualità”, usa Perplexity; altrimenti Gemini
        const needsWeb = /news|oggi|attual|fonte|link|dove|prezzo|disponibile/i.test(prompt);
        return needsWeb ? await askPerplexity(full) : await askGemini(full);
    }

    // PRO: preferisci Perplexity per info web; altrimenti OpenAI; fallback Gemini
    const needsWeb = /news|oggi|attual|fonte|link|dove|prezzo|disponibile|ricerca/i.test(prompt);
    if (needsWeb) return await askPerplexity(full);

    try {
        return await askOpenAI(full);
    } catch {
        return await askGemini(full);
    }
}
