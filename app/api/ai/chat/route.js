// /app/api/ai/chat/route.js
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseRoute, supabaseAdmin } from "@/lib/ai/supabaseServer";
import { GoogleGenerativeAI } from "@google/generative-ai";

/* ----------------------------- Helpers locali ----------------------------- */
function estimateTokens(str) {
    return Math.ceil((str || "").length / 4);
}

function parseDataURL(dataURL) {
    const m = String(dataURL || "").match(/^data:(.+?);base64,(.+)$/);
    if (!m) return null;
    return { mime: m[1], b64: m[2] };
}

/* ------------------------------- Handler POST ------------------------------ */
export async function POST(req) {
    // 1) Body e validazioni base
    const { threadId, userMessage, images = [], docs = [], fileUris = [] } = await req.json();
    if (!threadId || !userMessage) {
        return NextResponse.json({ error: "threadId e userMessage richiesti" }, { status: 400 });
    }

    // 2) Client Supabase per Route Handler + sessione
    const supabase = supabaseRoute();
    const {
        data: { session },
        error: sessErr,
    } = await supabase.auth.getSession();

    if (sessErr) {
        return NextResponse.json({ error: `Errore sessione: ${sessErr.message}` }, { status: 500 });
    }
    if (!session?.user) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const user = session.user;

    // 3) Lettura profilo/limiti piano
    const { data: profile, error: pErr } = await supabase
        .from("profiles")
        .select("plan, token_limit, tokens_used")
        .eq("id", user.id)
        .single();

    if (pErr) {
        return NextResponse.json({ error: pErr.message }, { status: 400 });
    }

    const tokenLimit = Number(profile?.token_limit ?? 0) || 0;
    const tokensUsedSoFar = Number(profile?.tokens_used ?? 0) || 0;

    if (tokenLimit && tokensUsedSoFar >= tokenLimit) {
        return NextResponse.json({ error: "Hai raggiunto il limite del tuo piano." }, { status: 403 });
    }

    // 4) Salva il messaggio dell’utente nello storico
    await supabase.from("ai_messages").insert({
        thread_id: threadId,
        user_id: user.id,
        role: "user",
        content: String(userMessage),
    });

    // 5) Recupera history per dare contesto al modello (ultimi N messaggi)
    const { data: history } = await supabase
        .from("ai_messages")
        .select("role, content")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });

    // 6) Prepara le parti per Gemini
    const parts = [];

    parts.push({
        text:
            "Sei l'AI di Get Healthy. Analizza contenuti (testo, immagini, file) e rispondi in modo pratico e chiaro " +
            "su alimentazione, ricette e benessere. Non fornire consigli medici; inserisci un breve disclaimer quando opportuno.",
    });

    const contextText = (history || [])
        .slice(-40)
        .map((m) => `${m.role === "user" ? "Utente" : "AI"}: ${m.content}`)
        .join("\n");
    if (contextText) parts.push({ text: `Contesto (estratto):\n${contextText}\n` });

    // Documenti testuali (snippet sicuro)
    const SAFE_DOC_CHARS = 18000;
    for (const d of docs.slice(0, 5)) {
        const name = (d?.name || "documento").toString();
        const text = (d?.text || "").toString();
        if (!text) {
            parts.push({ text: `Allegato non testuale o non estratto: ${name}\n` });
            continue;
        }
        const snippet = text.slice(0, SAFE_DOC_CHARS);
        parts.push({ text: `---\n[Documento: ${name}]\n${snippet}\n---\n` });
        if (text.length > SAFE_DOC_CHARS) parts.push({ text: `(Nota: ${name} troncato per lunghezza)\n` });
    }

    // Immagini in data URL
    for (const dataURL of images.slice(0, 4)) {
        const p = parseDataURL(dataURL);
        if (p && /^image\//.test(p.mime)) {
            parts.push({ inlineData: { data: p.b64, mimeType: p.mime } });
        }
    }

    // File già caricati su Gemini (PDF/DOCX ecc.)
    for (const f of (fileUris || []).slice(0, 10)) {
        if (f?.uri && f?.mimeType) {
            parts.push({ fileData: { fileUri: f.uri, mimeType: f.mimeType } });
            if (f.name) parts.push({ text: `File allegato: ${f.name}\n` });
        }
    }

    parts.push({ text: `Domanda:\n${userMessage}\n` });

    // 7) Inizializza Gemini e genera risposta
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: "GEMINI_API_KEY mancante nelle env" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image-preview" });

    let aiReply = "";
    try {
        const result = await model.generateContent(parts);
        const response = await result.response;
        aiReply = response.text() || "";
    } catch (err) {
        console.error("Errore Gemini:", err);
        return NextResponse.json({ error: "Errore nella risposta AI" }, { status: 500 });
    }

    // 8) Stima token e aggiorna profilo (admin se disponibile)
    const tokensUsedNow =
        estimateTokens(userMessage) +
        docs.reduce((s, d) => s + estimateTokens(d?.text || ""), 0) +
        estimateTokens(aiReply);

    const newTotal = tokensUsedSoFar + tokensUsedNow;

    // Prova prima con admin (service role). Se manca, tenta con client normale.
    try {
        const admin = supabaseAdmin(); // <-- funzione che crea il client admin
        await admin.from("profiles").update({ tokens_used: newTotal }).eq("id", user.id);
    } catch (e) {
        // Fallback: prova con il client normale (se la RLS lo consente)
        try {
            await supabase.from("profiles").update({ tokens_used: newTotal }).eq("id", user.id);
        } catch (e2) {
            console.error("Update tokens fallito:", e, e2);
            // non blocchiamo la risposta all’utente se la scrittura token fallisce
        }
    }

    // 9) Salva risposta AI
    await supabase.from("ai_messages").insert({
        thread_id: threadId,
        user_id: user.id,
        role: "assistant",
        content: aiReply,
    });

    // 10) Risposta finale
    return NextResponse.json({
        reply: aiReply,
        tokens_used_now: newTotal,
        token_limit: tokenLimit || null,
    });
}

