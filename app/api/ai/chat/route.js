import { supabaseServer, supabaseAdmin } from "@/lib/ai/supabaseServer";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function estimateTokens(str) {
    return Math.ceil((str || "").length / 4);
}
function parseDataURL(dataURL) {
    const m = String(dataURL || "").match(/^data:(.+?);base64,(.+)$/);
    if (!m) return null;
    return { mime: m[1], b64: m[2] };
}

export async function POST(req) {
    const { threadId, userMessage, images = [], docs = [], fileUris = [] } = await req.json();
    if (!threadId || !userMessage)
        return Response.json({ error: "threadId e userMessage richiesti" }, { status: 400 });

    const supabase = supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

    const { data: profile, error: pErr } = await supabase
        .from("profiles")
        .select("plan, token_limit, tokens_used")
        .eq("id", user.id)
        .single();
    if (pErr) return Response.json({ error: pErr.message }, { status: 400 });
    if (profile.tokens_used >= profile.token_limit)
        return Response.json({ error: "Hai raggiunto il limite del tuo piano." }, { status: 403 });

    await supabase.from("ai_messages").insert({
        thread_id: threadId,
        user_id: user.id,
        role: "user",
        content: userMessage,
    });

    const { data: history } = await supabase
        .from("ai_messages")
        .select("role, content")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });

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

    // documenti testuali in chiaro
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

    // immagini inline
    for (const dataURL of images.slice(0, 4)) {
        const p = parseDataURL(dataURL);
        if (p && /^image\//.test(p.mime)) {
            parts.push({ inlineData: { data: p.b64, mimeType: p.mime } });
        }
    }

    // file caricati su Gemini (PDF/DOCX ecc.)
    for (const f of (fileUris || []).slice(0, 10)) {
        if (f?.uri && f?.mimeType) {
            parts.push({ fileData: { fileUri: f.uri, mimeType: f.mimeType } });
            if (f.name) parts.push({ text: `File allegato: ${f.name}\n` });
        }
    }

    parts.push({ text: `Domanda:\n${userMessage}\n` });

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image-preview" });

    let aiReply = "";
    try {
        const result = await model.generateContent(parts);
        const response = await result.response;
        aiReply = response.text();
    } catch (err) {
        console.error("Errore Gemini:", err);
        return Response.json({ error: "Errore nella risposta AI" }, { status: 500 });
    }

    const tokensUsed =
        estimateTokens(userMessage) +
        docs.reduce((s, d) => s + estimateTokens(d?.text || ""), 0) +
        estimateTokens(aiReply);

    await supabaseAdmin
        .from("profiles")
        .update({ tokens_used: profile.tokens_used + tokensUsed })
        .eq("id", user.id);

    await supabase.from("ai_messages").insert({
        thread_id: threadId,
        user_id: user.id,
        role: "assistant",
        content: aiReply,
    });

    return Response.json({
        reply: aiReply,
        tokens_used_now: profile.tokens_used + tokensUsed,
        token_limit: profile.token_limit,
    });
}
