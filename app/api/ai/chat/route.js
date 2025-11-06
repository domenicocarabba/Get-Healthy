// /app/api/ai/chat/route.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { supabaseRoute, supabaseAdmin } from "@/lib/ai/supabaseServer.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PLAN, PLAN_LIMITS, normalizePlan } from "@/lib/ai/plans.js";
import { isCycleExpired } from "@/lib/ai/cycle.js";
// se preferisci import statico, lascia questa riga attiva e togli l'import dinamico sotto
import { getUserContext } from "@/lib/ai/userContext.js";

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
function safeStringify(obj, max = 8000) {
    const s = JSON.stringify(obj ?? {});
    return s.length > max ? s.slice(0, max) + " …(troncato)" : s;
}

/* ------------------------------- POST ------------------------------ */
export async function POST(req) {
    try {
        const {
            threadId,
            prompt,
            userMessage,
            images = [],
            docs = [],
            fileUris = [],
        } = await req.json();

        const messageText = (userMessage ?? prompt ?? "").toString().trim();
        if (!threadId || !messageText) {
            return NextResponse.json(
                { error: "threadId e prompt/userMessage sono obbligatori" },
                { status: 400 }
            );
        }

        // 1) Auth utente
        const supabase = supabaseRoute();
        const {
            data: { user },
            error: sessErr,
        } = await supabase.auth.getUser();
        if (sessErr)
            return NextResponse.json(
                { error: `Errore sessione: ${sessErr.message}` },
                { status: 500 }
            );
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // 2) Verifica proprietà thread
        const { data: thread } = await supabase
            .from("threads")
            .select("id")
            .eq("id", threadId)
            .eq("user_id", user.id)
            .single();
        if (!thread)
            return NextResponse.json({ error: "Thread non trovato" }, { status: 404 });

        // 3) Profilo + ciclo mensile (limite MENSILE)
        let plan = "base";
        let tokenLimit = 0;
        let tokensUsedSoFar = 0;
        let cycleStart = null;

        let { data: profile } = await supabase
            .from("profiles")
            .select("plan, token_limit, tokens_used, cycle_start")
            .eq("id", user.id)
            .maybeSingle();

        if (!profile) {
            const now = new Date().toISOString();
            plan = "base";
            tokenLimit = PLAN_LIMITS[plan];
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

        plan = normalizePlan(profile.plan || "base");
        tokenLimit = Number(profile.token_limit || PLAN_LIMITS[plan]);
        tokensUsedSoFar = Number(profile.tokens_used || 0);
        cycleStart = profile.cycle_start;

        if (!cycleStart) {
            const now = new Date().toISOString();
            await supabase
                .from("profiles")
                .update({ cycle_start: now, tokens_used: 0 })
                .eq("id", user.id);
            cycleStart = now;
            tokensUsedSoFar = 0;
        } else if (isCycleExpired(cycleStart)) {
            const now = new Date().toISOString();
            await supabase
                .from("profiles")
                .update({
                    cycle_start: now,
                    tokens_used: 0,
                    token_limit: PLAN_LIMITS[plan],
                })
                .eq("id", user.id);
            tokensUsedSoFar = 0;
            tokenLimit = PLAN_LIMITS[plan];
            cycleStart = now;
        }

        if (tokenLimit && tokensUsedSoFar >= tokenLimit) {
            return NextResponse.json(
                { error: "Hai raggiunto il limite del tuo piano per questo mese." },
                { status: 403 }
            );
        }

        // 4) SOFT CONSENT: leggi ma NON bloccare
        const { data: consentRow } = await supabase
            .from("user_consents")
            .select("health_data")
            .eq("user_id", user.id)
            .maybeSingle();

        const hasConsent = !!consentRow?.health_data;

        // 5) Salva messaggio utente
        await supabase.from("messages").insert({
            thread_id: threadId,
            user_id: user.id,
            role: "user",
            content: messageText,
        });

        // 6) Storia (ultimi 40)
        const { data: history } = await supabase
            .from("messages")
            .select("role, content")
            .eq("thread_id", threadId)
            .eq("user_id", user.id)
            .order("created_at", { ascending: true })
            .limit(40);

        // 7) Carica contesto personale SOLO se c'è consenso
        let ctx = null;
        if (hasConsent) {
            // se preferisci import dinamico: const { getUserContext } = await import("@/lib/ai/userContext.js");
            ctx = await getUserContext(user.id);
        }

        const missing = [];
        if (hasConsent && ctx) {
            if (!ctx.metrics?.height_cm) missing.push("altezza");
            if (!ctx.metrics?.weight_kg) missing.push("peso");
            if (!ctx.metrics?.activity) missing.push("livello attività");
            if (!ctx.diet?.meals_per_day) missing.push("pasti/giorno");
        }

        // 8) Prepara input Gemini
        const contents = [];

        // Istruzioni base
        contents.push({
            role: "user",
            parts: [
                {
                    text:
                        "Sei l'AI di Get Healthy. Fornisci piani, ricette e allenamenti chiari e pratici. " +
                        "Non fornire consigli medici; aggiungi un breve disclaimer quando opportuno.",
                },
            ],
        });

        if (hasConsent && ctx) {
            // Dati personali disponibili
            contents.push({
                role: "user",
                parts: [
                    {
                        text:
                            "### DATI UTENTE (JSON, compattato)\n" +
                            safeStringify({
                                profile: ctx.profile,
                                metrics: ctx.metrics,
                                diet: ctx.diet,
                                goals: ctx.goals,
                                allergies: ctx.allergies,
                                workouts: (ctx.workouts || []).slice(0, 5),
                            }),
                    },
                ],
            });

            if (missing.length) {
                contents.push({
                    role: "user",
                    parts: [
                        {
                            text:
                                "ATTENZIONE MODELLO: Mancano questi dati chiave → " +
                                missing.join(", ") +
                                ". Se strettamente necessario, chiedi SOLO questi campi in modo conciso.",
                        },
                    ],
                });
            }
        } else {
            // Nessun consenso → risposte generiche
            contents.push({
                role: "user",
                parts: [
                    {
                        text:
                            "L'utente NON ha fornito consenso all'uso di dati salute. " +
                            "Rispondi in modo generico e sicuro, senza assumere dati personali o clinici. " +
                            "Se una personalizzazione avanzata potrebbe essere utile, suggerisci FACOLTATIVAMENTE di attivarla su /account/health.",
                    },
                ],
            });
        }

        // Storia chat (compattata)
        if (history?.length) {
            const ctxHist = history
                .map((m) => `${m.role === "user" ? "Utente" : "AI"}: ${m.content}`)
                .join("\n")
                .slice(0, 20000);
            contents.push({
                role: "user",
                parts: [{ text: `Contesto conversazione (estratto):\n${ctxHist}` }],
            });
        }

        // Allegati testuali
        const SAFE_DOC_CHARS = 18000;
        for (const d of (docs || []).slice(0, 5)) {
            const name = (d?.name || "documento").toString();
            const text = (d?.text || "").toString();
            if (text) {
                const snippet = text.slice(0, SAFE_DOC_CHARS);
                contents.push({
                    role: "user",
                    parts: [{ text: `---\n[Documento: ${name}]\n${snippet}\n---` }],
                });
                if (text.length > SAFE_DOC_CHARS) {
                    contents.push({
                        role: "user",
                        parts: [{ text: `(Nota: ${name} troncato per lunghezza)` }],
                    });
                }
            } else {
                contents.push({
                    role: "user",
                    parts: [{ text: `Allegato non testuale o non estratto: ${name}` }],
                });
            }
        }

        // Immagini (data URL)
        for (const dataURL of (images || []).slice(0, 4)) {
            const p = parseDataURL(dataURL);
            if (p && /^image\//.test(p.mime)) {
                contents.push({
                    role: "user",
                    parts: [{ inlineData: { data: p.b64, mimeType: p.mime } }],
                });
            }
        }

        // File (Gemini File API)
        for (const f of (fileUris || []).slice(0, 10)) {
            if (f?.uri && f?.mimeType) {
                contents.push({
                    role: "user",
                    parts: [{ fileData: { fileUri: f.uri, mimeType: f.mimeType } }],
                });
                if (f.name)
                    contents.push({ role: "user", parts: [{ text: `File allegato: ${f.name}` }] });
            }
        }

        // Istruzioni di output
        contents.push({
            role: "user",
            parts: [
                {
                    text:
                        "### ISTRUZIONI DI OUTPUT\n" +
                        "- Se proponi un piano giornaliero: 5 pasti, kcal totali, macro per pasto e lista spesa sintetica.\n" +
                        "- Se proponi ricette: ingredienti in grammi/ml, step sintetici, kcal e macro stimate.\n" +
                        "- Se proponi allenamento: esercizi con serie×ripetizioni, RIR e recupero.\n" +
                        "- Se mancano dati essenziali (solo con consenso), chiedi SOLO quelli mancanti.",
                },
            ],
        });

        // Domanda finale
        contents.push({ role: "user", parts: [{ text: messageText }] });

        // 9) Chiamata a Gemini (limite PER-RISPOSTA da PLAN[plan].ctx)
        const perReplyMax = PLAN[plan].ctx;
        const key = process.env.GEMINI_API_KEY;
        if (!key)
            return NextResponse.json({ error: "GEMINI_API_KEY mancante" }, { status: 500 });

        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: modelName() });

        let aiReply = "";
        try {
            const result = await model.generateContent({
                contents,
                generationConfig: {
                    maxOutputTokens: perReplyMax,
                    temperature: 0.7,
                },
            });
            aiReply = result?.response?.text?.() || "";
        } catch (err) {
            console.error("Errore Gemini:", err);
            return NextResponse.json({ error: "Errore nella risposta AI" }, { status: 500 });
        }

        // 10) Calcolo e update token (mensili)
        const tokensUsedNow =
            estimateTokens(messageText) +
            (docs || []).reduce((s, d) => s + estimateTokens(d?.text || ""), 0) +
            estimateTokens(aiReply);

        const newTotal = tokensUsedSoFar + tokensUsedNow;

        try {
            const admin = supabaseAdmin?.() || supabase;
            await admin
                .from("profiles")
                .update({
                    tokens_used: newTotal,
                    token_limit: PLAN_LIMITS[plan],
                })
                .eq("id", user.id);
        } catch (e) {
            console.error("Update tokens fallito:", e);
        }

        // 11) Salva risposta AI
        await supabase.from("messages").insert({
            thread_id: threadId,
            user_id: user.id,
            role: "assistant",
            content: aiReply,
        });

        // 12) Risposta finale
        return NextResponse.json({
            reply: aiReply,
            threadId,
            tokens_used_now: tokensUsedNow,
            token_limit: tokenLimit,
            model: modelName(),
            missing_fields: missing, // utile per UI (solo se consenso)
            used_personalization: hasConsent, // flag utile alla UI
        });
    } catch (e) {
        console.error("POST /api/ai/chat error:", e);
        return NextResponse.json({ error: "Errore interno" }, { status: 500 });
    }
}
