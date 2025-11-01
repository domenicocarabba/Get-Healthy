// /app/api/ai/chat/route.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { supabaseRoute, supabaseAdmin } from "@/lib/ai/supabaseServer";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { planLimit } from "@/lib/ai/plans";
import { isCycleExpired } from "@/lib/ai/cycle";

/* ----------------------------- Helpers ----------------------------- */
function estimateTokens(str) {
    return Math.ceil((str || "").length / 4);
}
function parseDataURL(dataURL) {
    const m = String(dataURL || "").match(/^data:(.+?);base64,(.+)$/);
    if (!m) return null;
    return { mime: m[1], b64: m[2] };
}
function modelName() {
    return process.env.GEMINI_MODEL || "gemini-2.5-flash-image-preview";
}

/* ------------------------------- POST ------------------------------ */
export async function POST(req) {
    try {
        const { threadId, prompt, userMessage, images = [], docs = [], fileUris = [] } = await req.json();

        const messageText = (userMessage ?? prompt ?? "").toString().trim();
        if (!threadId || !messageText) {
            return NextResponse.json({ error: "threadId e prompt/userMessage sono obbligatori" }, { status: 400 });
        }

        // 1️⃣ Autenticazione utente
        const supabase = supabaseRoute();
        const { data: { user }, error: sessErr } = await supabase.auth.getUser();
        if (sessErr) return NextResponse.json({ error: `Errore sessione: ${sessErr.message}` }, { status: 500 });
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // 2️⃣ Verifica proprietà del thread
        const { data: thread } = await supabase
            .from("threads")
            .select("id")
            .eq("id", threadId)
            .eq("user_id", user.id)
            .single();
        if (!thread) return NextResponse.json({ error: "Thread non trovato" }, { status: 404 });

        // 3️⃣ Carica o crea profilo con reset mensile
        let tokenLimit = 0, tokensUsedSoFar = 0, cycleStart = null, plan = "base";

        let { data: profile } = await supabase
            .from("profiles")
            .select("plan, token_limit, tokens_used, cycle_start")
            .eq("id", user.id)
            .single();

        if (!profile) {
            const now = new Date().toISOString();
            plan = "base";
            tokenLimit = planLimit(plan);
            tokensUsedSoFar = 0;
            cycleStart = now;

            await supabase.from("profiles").insert({
                id: user.id,
                plan,
                token_limit: tokenLimit,
                tokens_used: 0,
                cycle_start: now,
            });

            profile = { plan, token_limit: tokenLimit, tokens_used: 0, cycle_start: now };
        }

        plan = profile.plan || "base";
        tokenLimit = profile.token_limit || planLimit(plan);
        tokensUsedSoFar = Number(profile.tokens_used || 0);
        cycleStart = profile.cycle_start;

        if (!cycleStart) {
            const now = new Date().toISOString();
            await supabase.from("profiles").update({ cycle_start: now, tokens_used: 0 }).eq("id", user.id);
            cycleStart = now;
        } else if (isCycleExpired(cycleStart)) {
            const now = new Date().toISOString();
            await supabase.from("profiles").update({
                cycle_start: now,
                tokens_used: 0,
                token_limit: planLimit(plan),
            }).eq("id", user.id);
            tokensUsedSoFar = 0;
            tokenLimit = planLimit(plan);
            cycleStart = now;
        }

        if (tokenLimit && tokensUsedSoFar >= tokenLimit) {
            return NextResponse.json({ error: "Hai raggiunto il limite del tuo piano per questo mese." }, { status: 403 });
        }

        // 4️⃣ Salva messaggio utente
        await supabase.from("messages").insert({
            thread_id: threadId,
            user_id: user.id,
            role: "user",
            content: messageText,
        });

        // 5️⃣ Recupera history (ultimi 40 messaggi)
        const { data: history } = await supabase
            .from("messages")
            .select("role, content")
            .eq("thread_id", threadId)
            .eq("user_id", user.id)
            .order("created_at", { ascending: true })
            .limit(40);

        // 6️⃣ Prepara input per Gemini
        const contents = [];

        // Istruzioni base
        contents.push({
            role: "user",
            parts: [
                {
                    text:
                        "Sei l'AI di Get Healthy. Dai risposte pratiche su alimentazione, ricette e benessere. " +
                        "Non fornire consigli medici, ma includi un breve disclaimer quando opportuno.",
                },
            ],
        });

        // Contesto (estratto)
        if (history?.length) {
            const ctx = history
                .map((m) => `${m.role === "user" ? "Utente" : "AI"}: ${m.content}`)
                .join("\n")
                .slice(0, 20000);
            contents.push({ role: "user", parts: [{ text: `Contesto (estratto):\n${ctx}` }] });
        }

        // Allegati testuali
        const SAFE_DOC_CHARS = 18000;
        for (const d of (docs || []).slice(0, 5)) {
            const name = (d?.name || "documento").toString();
            const text = (d?.text || "").toString();
            if (text) {
                const snippet = text.slice(0, SAFE_DOC_CHARS);
                contents.push({ role: "user", parts: [{ text: `---\n[Documento: ${name}]\n${snippet}\n---` }] });
                if (text.length > SAFE_DOC_CHARS) {
                    contents.push({ role: "user", parts: [{ text: `(Nota: ${name} troncato per lunghezza)` }] });
                }
            } else {
                contents.push({ role: "user", parts: [{ text: `Allegato non testuale o non estratto: ${name}` }] });
            }
        }

        // Immagini (data URL)
        for (const dataURL of (images || []).slice(0, 4)) {
            const p = parseDataURL(dataURL);
            if (p && /^image\//.test(p.mime)) {
                contents.push({ role: "user", parts: [{ inlineData: { data: p.b64, mimeType: p.mime } }] });
            }
        }

        // File (da Gemini File API)
        for (const f of (fileUris || []).slice(0, 10)) {
            if (f?.uri && f?.mimeType) {
                contents.push({ role: "user", parts: [{ fileData: { fileUri: f.uri, mimeType: f.mimeType } }] });
                if (f.name) contents.push({ role: "user", parts: [{ text: `File allegato: ${f.name}` }] });
            }
        }

        // Domanda finale
        contents.push({ role: "user", parts: [{ text: messageText }] });

        // 7️⃣ Chiamata a Gemini
        const key = process.env.GEMINI_API_KEY;
        if (!key) return NextResponse.json({ error: "GEMINI_API_KEY mancante" }, { status: 500 });

        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: modelName() });

        let aiReply = "";
        try {
            const result = await model.generateContent({ contents });
            aiReply = result?.response?.text?.() || "";
        } catch (err) {
            console.error("Errore Gemini:", err);
            return NextResponse.json({ error: "Errore nella risposta AI" }, { status: 500 });
        }

        // 8️⃣ Calcola e aggiorna token
        const tokensUsedNow =
            estimateTokens(messageText) +
            (docs || []).reduce((s, d) => s + estimateTokens(d?.text || ""), 0) +
            estimateTokens(aiReply);
        const newTotal = tokensUsedSoFar + tokensUsedNow;

        try {
            const admin = supabaseAdmin?.() || supabase;
            await admin
                .from("profiles")
                .update({ tokens_used: newTotal, token_limit: planLimit(plan) })
                .eq("id", user.id);
        } catch (e) {
            console.error("Update tokens fallito:", e);
        }

        // 9️⃣ Salva risposta AI
        await supabase.from("messages").insert({
            thread_id: threadId,
            user_id: user.id,
            role: "assistant",
            content: aiReply,
        });

        // 🔟 Risposta finale
        return NextResponse.json({
            reply: aiReply,
            threadId,
            tokens_used_now: newTotal,
            token_limit: tokenLimit,
            model: modelName(),
        });
    } catch (e) {
        console.error("POST /api/ai/chat error:", e);
        return NextResponse.json({ error: "Errore interno" }, { status: 500 });
    }
}
