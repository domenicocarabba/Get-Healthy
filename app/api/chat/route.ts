// app/api/chat/route.ts
import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";
import { kv } from "@vercel/kv";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ---------- Tipi ---------- */
type Plan = "base" | "plus" | "pro";
type Body = {
    prompt?: unknown;       // string
    plan?: unknown;         // "base" | "plus" | "pro"
    images?: unknown;       // string[] dataURL/base64
    prefs?: Record<string, unknown>;
};

/* ---------- Config limiti ---------- */
const MONTHLY_CAPS: Record<Plan, number> = {
    base: 40_000,
    plus: 300_000,
    pro: 1_000_000,
};
const RATE_PER_HOUR: Record<Plan, number> = {
    base: 60,
    plus: 300,
    pro: 1000,
};
const PRIORITY_DELAY_MS: Record<Plan, number> = {
    base: 1000,
    plus: 250,
    pro: 0,
};

/* ---------- Helpers ---------- */
function monthKey(d = new Date()): string {
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
function hourKey(d = new Date()): string {
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
        d.getUTCDate()
    ).padStart(2, "0")}T${String(d.getUTCHours()).padStart(2, "0")}`;
}
// ~4 char ≈ 1 token
function estimateTokens(s: string): number {
    if (!s) return 0;
    return Math.max(0, Math.ceil(String(s).length / 4));
}
// costo approssimativo per immagine
function imageTokenCost(n: number): number {
    return Math.min(4, n) * 256;
}
function getOrCreateUserId(): string {
    const jar = cookies();
    const existing = jar.get("gh_uid")?.value as string | undefined;
    const uid = existing ?? crypto.randomUUID();
    if (!existing) {
        jar.set("gh_uid", uid, { path: "/", maxAge: 60 * 60 * 24 * 180, httpOnly: false });
    }
    return uid;
}
function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
}
function parseDataUrl(u: string): { mime: string; data: string } | null {
    // data:[<mime>];base64,<data>
    const m = u.match(/^data:([^;]+);base64,(.+)$/);
    if (!m) return null;
    return { mime: m[1], data: m[2] };
}

/* ---------- Handler ---------- */
export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as Body;

        const prompt = typeof body.prompt === "string" ? body.prompt.trim() : undefined;
        if (!prompt) {
            return NextResponse.json({ error: "Parametro 'prompt' mancante o non valido." }, { status: 400 });
        }

        const raw = (body.plan ?? "").toString().toLowerCase();
        const plan: Plan = raw === "plus" ? "plus" : raw === "pro" ? "pro" : "base";

        const images =
            Array.isArray(body.images)
                ? (body.images.filter((x) => typeof x === "string" && x.length > 0).slice(0, 4) as string[])
                : [];

        const userId = getOrCreateUserId();

        /* ── Rate-limit orario ── */
        const rk = `rate:${userId}:${hourKey()}`;
        const count = await kv.incr(rk);
        if (count === 1) await kv.expire(rk, 60 * 60);
        const perHour = RATE_PER_HOUR[plan];
        if (count > perHour) {
            return NextResponse.json(
                { error: `Hai superato il limite orario (${perHour}/h) del piano ${plan}.` },
                { status: 429 }
            );
        }

        /* ── Quota mensile (token) ── */
        const mk = `usage:${userId}:${monthKey()}`;
        const usedSoFar = (await kv.get<number>(mk)) || 0;
        const cap = MONTHLY_CAPS[plan];
        if (usedSoFar >= cap) {
            return NextResponse.json(
                { error: "Quota mensile esaurita per il tuo piano.", used_month: usedSoFar, cap_month: cap },
                { status: 402 }
            );
        }

        /* ── Priorità ── */
        const delay = PRIORITY_DELAY_MS[plan] ?? 0;
        if (delay > 0) await sleep(delay);

        /* ── Gemini stream ── */
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash-image-preview",
            generationConfig: { maxOutputTokens: 4096, temperature: 0.9 },
        });

        // costruisci parts: prompt + (eventuali) immagini
        const parts: any[] = [{ text: prompt }];
        for (const dataUrl of images) {
            const parsed = parseDataUrl(dataUrl);
            if (!parsed) continue;
            parts.push({
                inlineData: { mimeType: parsed.mime, data: parsed.data },
            });
        }

        const result = await model.generateContentStream({
            contents: [{ role: "user", parts }],
        });

        const encoder = new TextEncoder();
        let acc = "";

        const stream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const event of result.stream) {
                        const text = event?.text();
                        if (text) {
                            acc += text;
                            controller.enqueue(encoder.encode(text));
                        }
                    }

                    // calcola e registra usage
                    const usedNow =
                        estimateTokens(prompt) + estimateTokens(acc) + imageTokenCost(images.length);
                    const newTotal = await kv.incrby(mk, usedNow);
                    if (newTotal === usedNow) await kv.expire(mk, 60 * 60 * 24 * 45);

                    // salva cronologia (ultimo mese)
                    const hk = `hist:${userId}:${monthKey()}`;
                    const now = Date.now();
                    await kv.rpush(
                        hk,
                        JSON.stringify({ ts: now, role: "user", text: prompt, images_count: images.length }),
                        JSON.stringify({ ts: now, role: "assistant", text: acc })
                    );
                    await kv.ltrim(hk, -500, -1);

                    // invia un piccolo trailer con i dati usage (il client lo intercetta e non lo mostra)
                    const trailer = {
                        usage: {
                            used_now: usedNow,
                            used_month: newTotal,
                            cap_month: cap,
                            plan,
                        },
                    };
                    controller.enqueue(encoder.encode(`\n<<<USAGE:${JSON.stringify(trailer)}>>>`));
                } catch (e) {
                    // in caso di errore durante lo stream prova a inviare un messaggio finale
                    controller.enqueue(encoder.encode("\n[Errore durante lo stream]"));
                } finally {
                    controller.close();
                }
            },
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                // per sicurezza con edge proxy
                "Cache-Control": "no-store",
            },
        });
    } catch (err: any) {
        console.error("❌ /api/chat error:", err);
        return NextResponse.json({ error: err?.message || "Errore interno del server" }, { status: 500 });
    }
}
