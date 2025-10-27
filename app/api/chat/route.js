import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ───────────────── helpers ───────────────── */
function jsonOK(obj) { return NextResponse.json(obj); }
function badRequest(msg) { return NextResponse.json({ error: msg }, { status: 400 }); }
function upstreamError(msg, code = 502) { return NextResponse.json({ error: msg }, { status: code }); }

/* ───────────────── route ───────────────── */
export async function POST(req) {
    try {
        const { prompt, plan: planFromBody } = await req.json();
        if (!prompt || typeof prompt !== "string") {
            return badRequest("Missing 'prompt' (string).");
        }

        // piano: body → env → base
        const plan =
            (planFromBody && String(planFromBody).toLowerCase()) ||
            (process.env.USER_PLAN && process.env.USER_PLAN.toLowerCase()) ||
            "base";

        /* ───────────── BASE → GEMINI (AI Studio key) ───────────── */
        if (plan === "base") {
            const gk = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
            if (!gk) return badRequest("Manca GOOGLE_GENERATIVE_AI_API_KEY.");

            // Prova prima l’API v1 (Google Cloud), poi v1beta (AI Studio),
            // e vari modelli comuni. Se fallisce → fallback a OpenAI/Perplexity.
            const endpoints = ["v1", "v1beta"];
            const models = [
                "gemini-1.5-flash",
                "gemini-1.5-flash-latest",
                "gemini-1.5-pro",
                "gemini-1.5-pro-latest",
                "gemini-pro" // legacy, spesso sbloccato
            ];

            for (const ver of endpoints) {
                for (const m of models) {
                    try {
                        const url = `https://generativelanguage.googleapis.com/${ver}/models/${m}:generateContent?key=${gk}`;
                        const r = await fetch(url, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                contents: [{ role: "user", parts: [{ text: prompt }] }],
                                generationConfig: { temperature: 0.4 }
                            })
                        });

                        if (!r.ok) {
                            // 404/400 → modello o versione non disponibile; prova il prossimo
                            if (r.status === 404 || r.status === 400) {
                                const t = await r.text().catch(() => "");
                                console.warn(`Gemini ${ver}/${m} -> ${r.status}`, t);
                                continue;
                            }
                            // altri errori = fermati e passa al fallback
                            const t = await r.text().catch(() => "");
                            console.error(`Gemini ${ver}/${m} upstream ${r.status}`, t);
                            break;
                        }

                        const data = await r.json();
                        const text =
                            data?.candidates?.[0]?.content?.parts?.[0]?.text ??
                            data?.candidates?.[0]?.output ?? "…";
                        if (text) return jsonOK({ result: text, provider: `gemini:${ver}/${m}` });
                    } catch (e) {
                        console.warn(`Gemini ${ver}/${m} network error:`, e?.message);
                        continue;
                    }
                }
            }

            // ───── Fallback 1: OpenAI (se disponibile) ─────
            if (process.env.OPENAI_API_KEY) {
                try {
                    const { default: OpenAI } = await import("openai");
                    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
                    const resp = await client.chat.completions.create({
                        model: "gpt-4o-mini",
                        messages: [
                            { role: "system", content: "Sei un assistente nutrizione/ricette conciso e pratico." },
                            { role: "user", content: prompt }
                        ],
                        temperature: 0.4
                    });
                    const text = resp?.choices?.[0]?.message?.content?.trim() || "…";
                    return jsonOK({ result: text, provider: "openai:fallback" });
                } catch (e) {
                    console.error("OpenAI fallback error:", e);
                }
            }

            // ───── Fallback 2: Perplexity (se disponibile) ─────
            if (process.env.PERPLEXITY_API_KEY) {
                try {
                    const r = await fetch("https://api.perplexity.ai/chat/completions", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`
                        },
                        body: JSON.stringify({
                            model: "llama-3.1-sonar-small-128k-online",
                            messages: [{ role: "user", content: prompt }],
                            temperature: 0.2
                        })
                    });
                    if (!r.ok) {
                        const t = await r.text().catch(() => "");
                        console.error("Perplexity upstream error:", r.status, t);
                        return upstreamError(`Perplexity error ${r.status}`);
                    }
                    const data = await r.json();
                    const text = data?.choices?.[0]?.message?.content || "…";
                    return jsonOK({ result: text, provider: "perplexity:fallback" });
                } catch (e) {
                    console.error("Perplexity fallback error:", e);
                }
            }

            return upstreamError(
                "Nessun provider disponibile: abilita i modelli Gemini in AI Studio o configura OPENAI_API_KEY / PERPLEXITY_API_KEY."
            );
        }

        /* ───────────── PLUS → PERPLEXITY ───────────── */
        if (plan === "plus") {
            const key = process.env.PERPLEXITY_API_KEY;
            if (!key) return badRequest("Manca PERPLEXITY_API_KEY.");
            const r = await fetch("https://api.perplexity.ai/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${key}`
                },
                body: JSON.stringify({
                    model: "llama-3.1-sonar-small-128k-online",
                    messages: [{ role: "user", content: prompt }],
                    temperature: 0.2
                })
            });
            if (!r.ok) {
                const t = await r.text().catch(() => "");
                console.error("Perplexity upstream error:", r.status, t);
                return upstreamError(`Perplexity error ${r.status}`);
            }
            const data = await r.json();
            const text = data?.choices?.[0]?.message?.content || "…";
            return jsonOK({ result: text, provider: "perplexity:plus" });
        }

        /* ───────────── PRO → OPENAI ───────────── */
        const openaiKey = process.env.OPENAI_API_KEY;
        if (!openaiKey) return badRequest("Manca OPENAI_API_KEY.");
        const { default: OpenAI } = await import("openai");
        const client = new OpenAI({ apiKey: openaiKey });

        const resp = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "Sei un assistente nutrizione/ricette conciso e pratico." },
                { role: "user", content: prompt }
            ],
            temperature: 0.4
        });
        const text = resp?.choices?.[0]?.message?.content?.trim() || "…";
        return jsonOK({ result: text, provider: "openai:pro" });
    } catch (err) {
        console.error("API /chat fatal:", err);
        return NextResponse.json({ error: err?.message || "Unhandled server error" }, { status: 500 });
    }
}
