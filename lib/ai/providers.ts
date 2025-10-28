// lib/ai/providers.ts

export type Plan = "base" | "plus" | "pro";

/** --------- OPENAI ---------- */
export async function askOpenAI(prompt: string): Promise<string> {
    const key = process.env.OPENAI_API_KEY;
    if (!key) return "Nessuna risposta (OpenAI): manca OPENAI_API_KEY";

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
        }),
    });

    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? "Nessuna risposta (OpenAI)";
}

/** --------- GEMINI ---------- */
export async function askGemini(prompt: string): Promise<string> {
    const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!key) return "Nessuna risposta (Gemini): manca GOOGLE_GENERATIVE_AI_API_KEY";

    // 👇 scegli il modello via ENV, default a 2.5 flash image preview
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash-image-preview";

    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
            }),
        }
    );

    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "Nessuna risposta (Gemini)";
}

/** --------- PERPLEXITY ---------- */
export async function askPerplexity(prompt: string): Promise<string> {
    const key = process.env.PERPLEXITY_API_KEY;
    if (!key) return "Nessuna risposta (Perplexity): manca PERPLEXITY_API_KEY";

    const res = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: "llama-3.1-sonar-small-128k-online",
            messages: [{ role: "user", content: prompt }],
        }),
    });

    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? "Nessuna risposta (Perplexity)";
}

/** --------- COMBINATORE PER PIANO ---------- */
export async function askAI(prompt: string, plan: Plan = "base"): Promise<string> {
    if (plan === "base") {
        return askGemini(prompt);
    } else if (plan === "plus") {
        const [g, p] = await Promise.all([askGemini(prompt), askPerplexity(prompt)]);
        return `${g}\n\n---\n\n${p}`;
    } else {
        const [o, g, p] = await Promise.all([
            askOpenAI(prompt),
            askGemini(prompt),
            askPerplexity(prompt),
        ]);
        return `🧠 ChatGPT:\n${o}\n\n✨ Gemini:\n${g}\n\n🔍 Perplexity:\n${p}`;
    }
}
