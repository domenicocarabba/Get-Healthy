import { NextResponse } from "next/server";

// usa Node runtime (gli SDK non girano su Edge)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function badRequest(msg) {
    return NextResponse.json({ error: msg }, { status: 400 });
}
function upstreamError(msg) {
    return NextResponse.json({ error: msg }, { status: 502 });
}

export async function POST(req) {
    try {
        const { prompt, plan: planFromBody } = await req.json();
        if (!prompt || typeof prompt !== "string") {
            return badRequest("Missing 'prompt' string in request body.");
        }

        // piano: dal body → env USER_PLAN → 'base'
        const plan =
            (planFromBody && String(planFromBody).toLowerCase()) ||
            (process.env.USER_PLAN && process.env.USER_PLAN.toLowerCase()) ||
            "base";

        if (plan === "base") {
            const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
            if (!key) return badRequest("Manca GOOGLE_GENERATIVE_AI_API_KEY.");

            // ✅ REST API v1 (niente SDK)
            const model = "gemini-1.5-flash-001"; // stabile; puoi provare anche "gemini-1.5-pro-001"
            const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${key}`;

            const r = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [
                        {
                            role: "user",
                            parts: [{ text: prompt }],
                        },
                    ],
                    generationConfig: {
                        temperature: 0.4,
                    },
                }),
            });

            if (!r.ok) {
                const body = await r.text();
                console.error("Gemini REST error:", r.status, body);
                return upstreamError(`Gemini error ${r.status}`);
            }

            const data = await r.json();
            const text =
                data?.candidates?.[0]?.content?.parts?.[0]?.text ||
                data?.candidates?.[0]?.output || // alcuni backend
                "…";
            return NextResponse.json({ result: text });
        }

        if (plan === "plus") {
            // ===== Perplexity =====
            const key = process.env.PERPLEXITY_API_KEY;
            if (!key)
                return badRequest(
                    "Manca PERPLEXITY_API_KEY. Aggiungila in .env.local o su Vercel."
                );
            const r = await fetch("https://api.perplexity.ai/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${key}`,
                },
                body: JSON.stringify({
                    model: "llama-3.1-sonar-small-128k-online",
                    messages: [{ role: "user", content: prompt }],
                    temperature: 0.2,
                }),
            });
            if (!r.ok) {
                const body = await r.text();
                console.error("Perplexity upstream error:", r.status, body);
                return upstreamError(`Perplexity error ${r.status}`);
            }
            const data = await r.json();
            const text = data?.choices?.[0]?.message?.content || "…";
            return NextResponse.json({ result: text });
        }

        // ===== PRO (default) → OpenAI =====
        const openaiKey = process.env.OPENAI_API_KEY;
        if (!openaiKey)
            return badRequest("Manca OPENAI_API_KEY. Aggiungila in .env.local o su Vercel.");
        const { default: OpenAI } = await import("openai");
        const client = new OpenAI({ apiKey: openaiKey });

        const resp = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "Sei un assistente nutrizione/ricette educato e conciso." },
                { role: "user", content: prompt },
            ],
            temperature: 0.4,
        });
        const text = resp?.choices?.[0]?.message?.content?.trim() || "…";
        return NextResponse.json({ result: text });
    } catch (err) {
        console.error("API /chat fatal error:", err);
        return NextResponse.json(
            { error: err?.message || "Unhandled server error" },
            { status: 500 }
        );
    }
}
