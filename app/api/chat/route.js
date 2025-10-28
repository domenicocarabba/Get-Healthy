import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ─────────── Helpers ─────────── */
const ok = (obj) => NextResponse.json(obj);
const bad = (msg) => NextResponse.json({ error: msg }, { status: 400 });
const upstream = (msg, detail = "", status = 502) =>
    NextResponse.json({ error: msg, detail }, { status });

/* ─────────── Gemini (BASE) ─────────── */
async function callGemini(prompt) {
    const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!key) throw new Error("Manca GOOGLE_GENERATIVE_AI_API_KEY.");

    const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: modelName });

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return { provider: `gemini:${modelName}`, text };
}

/* ─────────── OpenAI (PLUS / PRO) ─────────── */
async function callOpenAI(prompt) {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("Manca OPENAI_API_KEY.");

    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model,
            messages: [
                {
                    role: "system",
                    content:
                        "Sei un assistente per nutrizione e ricette, conciso e pratico.",
                },
                { role: "user", content: prompt },
            ],
            temperature: 0.4,
        }),
    });

    const raw = await r.text().catch(() => "");
    if (!r.ok) throw new Error(`OpenAI ${r.status}: ${raw}`);
    const data = raw ? JSON.parse(raw) : {};
    const text = data?.choices?.[0]?.message?.content?.trim() ?? "";
    return { provider: `openai:${model}`, text };
}

/* ─────────── Perplexity (solo PRO) ─────────── */
async function callPerplexity(prompt) {
    const key = process.env.PERPLEXITY_API_KEY;
    if (!key) throw new Error("Manca PERPLEXITY_API_KEY.");

    const model = process.env.PPLX_MODEL || "llama-3.1-sonar-small-128k-chat";
    const r = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model,
            messages: [
                { role: "system", content: "You are a helpful nutrition coach." },
                { role: "user", content: prompt },
            ],
            temperature: 0.2,
            stream: false,
        }),
    });

    const raw = await r.text().catch(() => "");
    if (!r.ok) throw new Error(`Perplexity ${r.status}: ${raw}`);
    const data = raw ? JSON.parse(raw) : {};
    const text = data?.choices?.[0]?.message?.content ?? "";
    return { provider: `perplexity:${model}`, text };
}

/* ─────────── Main route ─────────── */
export async function POST(req) {
    try {
        const { prompt, plan: planFromBody } = await req.json();
        if (!prompt || typeof prompt !== "string")
            return bad("Missing 'prompt' (string).");

        const plan =
            (planFromBody && String(planFromBody).toLowerCase()) ||
            (process.env.USER_PLAN && process.env.USER_PLAN.toLowerCase()) ||
            "base";

        /* ───── BASE → Gemini ───── */
        if (plan === "base") {
            const g = await callGemini(prompt);
            return ok({ result: g.text, parts: [g], provider: g.provider });
        }

        /* ───── PLUS → Gemini + OpenAI ───── */
        if (plan === "plus") {
            const results = await Promise.allSettled([
                callGemini(prompt),
                callOpenAI(prompt),
            ]);
            const errors = results.filter((r) => r.status === "rejected");
            if (errors.length) {
                const msgs = errors.map((e) => e.reason?.message || String(e.reason));
                return upstream("Uno o più provider hanno fallito (PLUS).", msgs.join("\n"));
            }
            const vals = results.map((r) => r.value);
            return ok({
                result: vals.map((v) => `[${v.provider}]\n${v.text}`).join("\n\n"),
                parts: vals,
                provider: "plus:gemini+openai",
            });
        }

        /* ───── PRO → Gemini + OpenAI + Perplexity ───── */
        if (plan === "pro") {
            const results = await Promise.allSettled([
                callGemini(prompt),
                callOpenAI(prompt),
                callPerplexity(prompt),
            ]);
            const errors = results.filter((r) => r.status === "rejected");
            if (errors.length) {
                const msgs = errors.map((e) => e.reason?.message || String(e.reason));
                return upstream("Uno o più provider hanno fallito (PRO).", msgs.join("\n"));
            }
            const vals = results.map((r) => r.value);
            return ok({
                result: vals.map((v) => `[${v.provider}]\n${v.text}`).join("\n\n"),
                parts: vals,
                provider: "pro:gemini+openai+perplexity",
            });
        }

        return bad(`Piano sconosciuto: ${plan}`);
    } catch (err) {
        console.error("API /chat fatal:", err);
        return NextResponse.json(
            { error: err?.message || "Unhandled server error" },
            { status: 500 }
        );
    }
}
