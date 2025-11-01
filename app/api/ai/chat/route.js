// /app/api/ai/chat/route.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { supabaseRoute, supabaseAdmin } from "@/lib/ai/supabaseServer";
import { GoogleGenerativeAI } from "@google/generative-ai";

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
    // Imposta da ENV se presente, altrimenti default stabile
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

        // Sessione utente
        const supabase = supabaseRoute();
        const { data: { user }, error: sessErr } = await supabase.auth.getUser();
        if (sessErr) return NextResponse.json({ error: `Errore sessione: ${sessErr.message}` }, { status: 500 });
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Ownership del thread
        const { data: thread, error: thErr } = await supabase
            .from("threads")
            .select("id")
            .eq("id", threadId)
            .eq("user_id", user.id)
            .single();

        if (thErr || !thread) {
            return NextResponse.json({ error: "Thread non trovato" }, { status: 404 });
        }

        // Limiti piano (se hai la tabella profiles; se non c’è, questa parte non blocca)
        let tokenLimit = 0, tokensUsedSoFar = 0;
        try {
            const { data: profile } = await supabase
                .from("profiles")
                .select("token_limit, tokens_used")
                .eq("id", user.id)
                .single();
            tokenLimit = Number(profile?.token_limit ?? 0) || 0;
            tokensUsedSoFar = Number(profile?.tokens_used ?? 0) || 0;
            if (tokenLimit && tokensUsedSoFar >= tokenLimit) {
                return NextResponse.json({ error: "Hai raggiunto il limite del tuo piano." }, { status: 403 });
            }
        } catch { /* ok se non esiste */ }

        // Salva messaggio utente su messages
        await supabase.from("messages").insert({
            thread_id: threadId,
            user_id: user.id,
            role: "user",
            content: messageText,
        });

        // History (ultimi 40)
        const { data: history } = await supabase
            .from("messages")
            .select("role, content")
            .eq("thread_id", threadId)
            .eq("user_id", user.id)
            .order("created_at", { ascending: true })
            .limit(40);

        // Parti per Gemini (contents)
        const contents = [];

        // System prompt / istruzioni
        contents.push({
            role: "user",
            parts: [{ text: "Sei l'AI di Get Healthy. Dai consigli pratici su alimentazione/ricette/benessere. Non fornire consigli medici; includi un breve disclaimer quando opportuno." }],
        });

        // Context breve
        if (history?.length) {
            const ctx = history
                .map((m) => `${m.role === "user" ? "Utente" : "AI"}: ${m.content}`)
                .join("\n")
                .slice(0, 20000);
            contents.push({ role: "user", parts: [{ text: `Contesto (estratto):\n${ctx}` }] });
        }

        // Allegati testuali (estratti)
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

        // File già caricati su Gemini (se usi File API)
        for (const f of (fileUris || []).slice(0, 10)) {
            if (f?.uri && f?.mimeType) {
                contents.push({ role: "user", parts: [{ fileData: { fileUri: f.uri, mimeType: f.mimeType } }] });
                if (f.name) contents.push({ role: "user", parts: [{ text: `File allegato: ${f.name}` }] });
            }
        }

        // Domanda corrente
        contents.push({ role: "user", parts: [{ text: messageText }] });

        // Gemini
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

        // Aggiorna contatori (se hai profiles)
        const tokensUsedNow =
            estimateTokens(messageText) +
            (docs || []).reduce((s, d) => s + estimateTokens(d?.text || ""), 0) +
            estimateTokens(aiReply);
        const newTotal = tokensUsedSoFar + tokensUsedNow;
        try {
            const admin = supabaseAdmin?.();
            if (admin) {
                await admin.from("profiles").update({ tokens_used: newTotal }).eq("id", user.id);
            } else {
                await supabase.from("profiles").update({ tokens_used: newTotal }).eq("id", user.id);
            }
        } catch { /* non bloccare la risposta */ }

        // Salva risposta assistant
        await supabase.from("messages").insert({
            thread_id: threadId,
            user_id: user.id,
            role: "assistant",
            content: aiReply,
        });

        return NextResponse.json({
            reply: aiReply,
            threadId,
            tokens_used_now: newTotal,
            token_limit: tokenLimit || null,
            model: modelName(),
        });
    } catch (e) {
        console.error("POST /api/ai/chat error:", e);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

