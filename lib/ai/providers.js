// lib/ai/providers.js

// Limiti di output per piano (token di risposta)
export const PLAN_LIMITS = {
    base: 512,
    plus: 1024,
    pro: 2048,
};

// Modello fisso (puoi override con env)
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-image-preview";

/** Normalizza una stringa immagine (data URL o base64) in inlineData { mimeType, data } */
function toInlineData(input) {
    if (!input) return null;

    // data URL?
    const m = String(input).match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/);
    if (m) return { mimeType: m[1], data: m[2] };

    // fallback: accetta base64 “nudo”, assume png
    const looksBase64 = /^[0-9a-zA-Z+/=\s]+$/.test(String(input));
    if (looksBase64) return { mimeType: "image/png", data: String(input).replace(/\s+/g, "") };

    return null;
}

/** Chiamata semplice solo testo (retro-compatibile) */
export async function askGemini(prompt, opts = {}) {
    return askGeminiMM({ userText: prompt, ...opts });
}

/**
 * Chiamata multimodale (testo + immagini).
 * - API key: usa GOOGLE_GENERATIVE_AI_API_KEY (fallback GEMINI_API_KEY)
 * - Modello: gemini-2.5-flash-image-preview (override con env GEMINI_MODEL)
 */
export async function askGeminiMM({
    userText,
    system,
    images,
    maxOutputTokens,
    temperature,
}) {
    const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
    if (!key) return "Nessuna risposta (Gemini): manca GOOGLE_GENERATIVE_AI_API_KEY";

    const generationConfig = {
        temperature: typeof temperature === "number" ? temperature : 0.7,
        ...(maxOutputTokens ? { maxOutputTokens } : {}),
    };

    const parts = [];
    if (userText) parts.push({ text: userText });

    if (images?.length) {
        for (const img of images.slice(0, 4)) {
            const inline = toInlineData(img);
            if (inline) parts.push({ inlineData: inline });
        }
    }

    const payload = {
        contents: [{ role: "user", parts }],
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
            ?.map((p) => p?.text ?? "")
            .join("") ??
        data?.candidates?.[0]?.content?.parts?.[0]?.text ??
        "";

    return text || "Nessuna risposta (Gemini).";
}

/** Helper: unica funzione pubblica se vuoi chiamare in base al piano */
export async function askAI(prompt, plan = "base") {
    const limit = PLAN_LIMITS[plan] ?? PLAN_LIMITS.base;
    return askGemini(prompt, { maxOutputTokens: limit });
}
