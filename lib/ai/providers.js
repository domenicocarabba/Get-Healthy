// lib/ai/providers.js

export async function askAI(prompt, plan = "base") {
    if (plan === "base") {
        return await askGemini(prompt);
    } else if (plan === "plus") {
        const [g, p] = await Promise.all([
            askGemini(prompt),
            askPerplexity(prompt),
        ]);
        return `${g}\n\n---\n\n${p}`;
    } else if (plan === "pro") {
        const [o, g, p] = await Promise.all([
            askOpenAI(prompt),
            askGemini(prompt),
            askPerplexity(prompt),
        ]);
        return `🧠 ChatGPT:\n${o}\n\n✨ Gemini:\n${g}\n\n🔍 Perplexity:\n${p}`;
    }
}

// ---- OPENAI ----
export async function askOpenAI(prompt) {
    const key = process.env.OPENAI_API_KEY;
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${key}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
        }),
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "Nessuna risposta (OpenAI)";
}

// ---- GEMINI ----
export async function askGemini(prompt) {
    const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${key}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        }
    );
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Nessuna risposta (Gemini)";
}

// ---- PERPLEXITY ----
export async function askPerplexity(prompt) {
    const key = process.env.PERPLEXITY_API_KEY;
    const res = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${key}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: "llama-3.1-sonar-small-128k-online",
            messages: [{ role: "user", content: prompt }],
        }),
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "Nessuna risposta (Perplexity)";
}
export { askGemini, askOpenAI, askPerplexity };
