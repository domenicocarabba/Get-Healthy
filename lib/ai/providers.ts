// lib/ai/providers.ts
export type Plan = "base" | "plus" | "pro";

export const PLAN_LIMITS: Record<Plan, number> = {
    base: 512,
    plus: 1024,
    pro: 2048,
};

// Modello fisso richiesto
const GEMINI_MODEL = "gemini-2.5-flash-image-preview";

type GenerateOpts = {
    maxOutputTokens?: number;
    temperature?: number;
    // facoltativi se usi askGeminiMM
    system?: string;
    images?: Array<string>; // data URL ("data:image/png;base64,...") o base64 puro
};

/**
 * Normalizza una stringa immagine (data URL o base64) in inlineData {mimeType, data}
 */
function toInlineData(input: string): { mimeType: string; data: string } | null {
    if (!input) return null;

    // data URL?
    const m = input.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/);
    if (m) {
        return { mimeType: m[1], data: m[2] };
    }

    // altrimenti prova a indovinare png di default
    // (se hai il mime a parte puoi passarlo nel body in futuro)
    const looksBase64 = /^[0-9a-zA-Z+/=\s]+$/.test(input);
    if (looksBase64) return { mimeType: "image/png", data: input.replace(/\s+/g, "") };

    return null;
}

/**
 * Chiamata semplice solo testo (retro-compatibile).
 */
export async function askGemini(
    prompt: string,
    opts?: { maxOutputTokens?: number; temperature?: number }
): Promise<string> {
    return askGeminiMM({ userText: prompt, ...opts });
}

/**
 * Chiamata multimodale (testo + immagini).
 * - API key da GOOGLE_GENERATIVE_AI_API_KEY (fallback: GEMINI_API_KEY)
 * - Modello fisso: gemini-2.5-flash-image-preview
 */
export async function askGeminiMM({
    userText,
    system,
    images,
    maxOutputTokens,
    temperature,
}: {
    userText: string;
    system?: string;
    images?: string[];
    maxOutputTokens?: number;
    temperature?: number;
}): Promise<string> {
    const key =
        process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
    if (!key) return "Nessuna risposta (Gemini): manca GOOGLE_GENERATIVE_AI_API_KEY";

    const generationConfig: Record<string, unknown> = {
        temperature: typeof temperature === "number" ? temperature : 0.7,
    };
    if (maxOutputTokens) generationConfig.maxOutputTokens = maxOutputTokens;

    const parts: any[] = [];
    if (userText) parts.push({ text: userText });

    if (images?.length) {
        for (const img of images.slice(0, 4)) { // max 4 immagini per richiesta (MVP)
            const inline = toInlineData(img);
            if (inline) parts.push({ inlineData: inline });
        }
    }

    const contents: any[] = [{ role: "user", parts }];

    const payload: any = {
        contents,
        generationConfig,
    };
    if (system && system.trim()) {
        payload.systemInstruction = { role: "system", parts: [{ text: system }] };
    }

    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
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
