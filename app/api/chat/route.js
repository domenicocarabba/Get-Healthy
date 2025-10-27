// app/api/chat/route.js
export const runtime = "nodejs"; // assicura Node (non Edge) per fetch e env
export const dynamic = "force-dynamic";

export async function POST(req) {
    try {
        const { prompt, plan = "base" } = await req.json();
        if (!prompt || typeof prompt !== "string") {
            return Response.json({ error: "Prompt mancante" }, { status: 400 });
        }

        // Verifica chiavi minime richieste in base al piano
        const need = {
            base: ["GOOGLE_GENERATIVE_AI_API_KEY"],
            plus: ["GOOGLE_GENERATIVE_AI_API_KEY", "PERPLEXITY_API_KEY"],
            pro: [
                "OPENAI_API_KEY",
                "GOOGLE_GENERATIVE_AI_API_KEY",
                "PERPLEXITY_API_KEY",
            ],
        }[plan] || [];

        for (const k of need) {
            if (!process.env[k]) {
                return Response.json(
                    { error: `Manca la variabile ${k}. Aggiungila in .env.local o su Vercel.` },
                    { status: 500 }
                );
            }
        }

        const text = await askAI(prompt, plan);
        return Response.json({ ok: true, plan, result: text });

    } catch (err) {
        console.error(err);
        return Response.json(
            { error: "Errore server", detail: String(err?.message || err) },
            { status: 500 }
        );
    }
}

// ---------------- Core dispatcher ----------------
async function askAI(prompt, plan = "base") {
    if (plan === "base") {
        return await askGemini(prompt);
    } else if (plan === "plus") {
        const [g, p] = await Promise.all([askGemini(prompt), askPerplexity(prompt)]);
        return `✨ Gemini:\n${g}\n\n🔍 Perplexity:\n${p}`;
    } else if (plan === "pro") {
        const [o, g, p] = await Promise.all([
            askOpenAI(prompt),
            askGemini(prompt),
            askPerplexity(prompt),
        ]);
        return `🧠 ChatGPT:\n${o}\n\n✨ Gemini:\n${g}\n\n🔍 Perplexity:\n${p}`;
    }
    // fallback
    return await askGemini(prompt);
}

// ---------------- Providers ----------------
async function askOpenAI(prompt) {
    const key = process.env.OPENAI_API_KEY;
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
        }),
    });
    if (!res.ok) {
        const err = await safeText(res);
        throw new Error(`OpenAI ${res.status}: ${err}`);
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || "Nessuna risposta (OpenAI)";
}

async function askGemini(prompt) {
    const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${key}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.7 },
            }),
        }
    );
    if (!res.ok) {
        const err = await safeText(res);
        throw new Error(`Gemini ${res.status}: ${err}`);
    }
    const data = await res.json();
    return (
        data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
        "Nessuna risposta (Gemini)"
    );
}

async function askPerplexity(prompt) {
    const key = process.env.PERPLEXITY_API_KEY;
    const res = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: "llama-3.1-sonar-small-128k-online",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
        }),
    });
    if (!res.ok) {
        const err = await safeText(res);
        throw new Error(`Perplexity ${res.status}: ${err}`);
    }
    const data = await res.json();
    return (
        data.choices?.[0]?.message?.content?.trim() ||
        "Nessuna risposta (Perplexity)"
    );
}

async function safeText(res) {
    try {
        return await res.text();
    } catch {
        return "<no-body>";
    }
}
