// lib/ai/providers.ts

export type Plan = "base" | "plus" | "pro";

export const PLAN_LIMITS: Record<Plan, number> = {
    base: 512,
    plus: 1024,
    pro: 2048,
};

// Modello fisso richiesto
const GEMINI_MODEL = "gemini-2.5-flash-image-preview";

/**
 * Chiamata a Gemini (REST).
 * - API key da GOOGLE_GENERATIVE_AI_API_KEY (fallback: GEMINI_API_KEY)
 * - Modello fisso: gemini-2.5-flash-image-preview
 * - maxOutputTokens limitato in base al piano
 */
export async function askGemini(
    prompt: string,
    opts?: { maxOutputTokens?: number; temperature?: number }
): Promise<string> {
    const key =
        process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
    if (!key) return "Nessuna risposta (Gemini): manca GOOGLE_GENERATIVE_AI_API_KEY";

    const temperature =
        typeof opts?.temperature === "number" ? opts.temperature : 0.7;
    const maxOutputTokens = opts?.maxOutputTokens;

    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: {
                    ...(maxOutputTokens ? { maxOutputTokens } : {}),
                    temperature,
                },
            }),
        }
    );

    if (!res.ok) {
        const err = await res.text().catch(() => "");
        return `Errore Gemini (${res.status}): ${err || "response non OK"}`;
    }

    const data = await res.json();
    const text =
        data?.candidates?.[0]?.content?.parts
            ?.map((p: any) => p?.text ?? "")
            .join("") ??
        data?.candidates?.[0]?.content?.parts?.[0]?.text ??
        "";

    return text || "Nessuna risposta (Gemini).";
}

/** Helper: unica funzione pubblica se vuoi chiamare in base al piano */
export async function askAI(prompt: string, plan: Plan = "base") {
    return askGemini(prompt, { maxOutputTokens: PLAN_LIMITS[plan] });
}
