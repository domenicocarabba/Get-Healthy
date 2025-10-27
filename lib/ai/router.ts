// /lib/ai/router.ts
import { askGemini, askOpenAI, askPerplexity } from "./providers";

export type Plan = "base" | "plus" | "pro";

export async function routeByPlan({
    plan,
    prompt,
}: {
    plan: Plan;
    prompt: string;
}) {
    const system =
        "Rispondi in modo chiaro, utile e conciso. Se chiedono consigli su salute/nutrizione, spiega che non sostituisci un professionista sanitario.";

    if (plan === "base") {
        // Solo Gemini
        return await askGemini({ prompt, system });
    }

    if (plan === "plus") {
        // Heuristics: se la domanda sembra “di attualità/ricerca”, usa Perplexity altrimenti Gemini
        const needsWeb = /news|oggi|attual|fonte|link|dove|prezzo|disponibile/i.test(prompt);
        if (needsWeb) return await askPerplexity({ prompt, system });
        return await askGemini({ prompt, system });
    }

    // pro → scegli il migliore o fai “ensemble” semplice
    // Esempio: prova Perplexity per info web; se non matcha, fallback a OpenAI; altrimenti Gemini.
    const needsWeb = /news|oggi|attual|fonte|link|dove|prezzo|disponibile|ricerca/i.test(prompt);
    if (needsWeb) return await askPerplexity({ prompt, system });

    // per tutto il resto preferisci OpenAI, fallback Gemini
    try {
        return await askOpenAI({ prompt, system });
    } catch {
        return await askGemini({ prompt, system });
    }
}
