// app/api/chat/route.ts
import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";
import { kv } from "@vercel/kv";
import { routeByPlan } from "@/lib/ai/router";
import type { Plan } from "@/lib/ai/providers";
import { redis } from "../../../lib/ai/kv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
// ~4 char ≈ 1 token; assegniamo anche un costo fisso per immagine
function estimateTokens(s: string): number {
    if (!s) return 0;
    return Math.max(0, Math.ceil(String(s).length / 4));
}
function imageTokenCost(n: number): number {
    // costo approssimativo per immagine per non lasciare illimitato
    return Math.min(4, n) * 256; // 256 token per immagine (MVP)
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

/* ---------- Handler ---------- */
type Body = {
    prompt?: unknown;       // string
    plan?: unknown;         // "base" | "plus" | "pro"
    images?: unknown;       // string[] (dataURL o base64)
    prefs?: Record<string, unknown>;
};

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as Body;

        const prompt = typeof body.prompt === "string" ? body.prompt.trim() : undefined;
        if (!prompt) {
            return NextResponse.json(
                { error: "Parametro 'prompt' mancante o non valido." },
                { status: 400 }
            );
        }

        const raw = (body.plan ?? "").toString().toLowerCase();
        const plan: Plan = raw === "plus" ? "plus" : raw === "pro" ? "pro" : "base";

        // immagini: tieni solo stringhe non vuote, max 4 (MVP)
        const images =
            Array.isArray(body.images)
                ? (body.images.filter((x) => typeof x === "string" && x.length > 0).slice(0, 4) as string[])
                : undefined;

        const prefs = body.prefs && typeof body.prefs === "object" ? body.prefs : undefined;

        const userId = getOrCreateUserId();
        const now = Date.now();

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

        /* ── Chiamata router (testo + immagini + prefs) ── */
        const text = await routeByPlan({ plan, prompt, images, prefs });

        // stima token: prompt + risposta + costo immagini
        const usedNow = estimateTokens(prompt) + estimateTokens(text) + imageTokenCost(images?.length || 0);

        // aggiorna usage mensile (TTL ~45d)
        const newTotal = await kv.incrby(mk, usedNow);
        if (newTotal === usedNow) await kv.expire(mk, 60 * 60 * 24 * 45);

        /* ── Salva cronologia chat ── */
        const hk = `hist:${userId}:${monthKey()}`;
        await kv.rpush(
            hk,
            JSON.stringify({ ts: now, role: "user", text: prompt, images_count: images?.length || 0 }),
            JSON.stringify({ ts: now, role: "assistant", text })
        );
        await kv.ltrim(hk, -500, -1);

        return NextResponse.json({
            result: text,
            usage: {
                used_now: usedNow,
                used_month: newTotal,
                cap_month: cap,
                plan,
            },
            provider: "gemini-2.5-flash-image-preview",
            images_count: images?.length || 0,
        });
    } catch (err: any) {
        console.error("❌ /api/chat error:", err);
        return NextResponse.json(
            { error: err?.message || "Errore interno del server" },
            { status: 500 }
        );
    }
}
