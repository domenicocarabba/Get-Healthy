// app/api/checkout/route.ts
import Stripe from "stripe";
import { NextResponse } from "next/server";

export const runtime = "nodejs"; // Stripe richiede Node runtime (non Edge)

// Tipi utili
type Plan = "base" | "plus" | "pro";
type PriceMap = Record<Plan, string | undefined>;

function j(obj: any, status = 200) {
    return NextResponse.json(obj, { status });
}

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({}));
        const rawPlan: string = (body?.plan || "").toLowerCase();
        const plan: Plan = (["base", "plus", "pro"].includes(rawPlan) ? rawPlan : "base") as Plan;

        const SITE =
            process.env.NEXT_PUBLIC_SITE_URL ||
            // fallback al dominio della richiesta (utile in preview/local)
            new URL(req.url).origin;

        // Se "base" è un piano gratuito → niente Stripe: porta direttamente a /success
        if (plan === "base" && !process.env.STRIPE_PRICE_BASE) {
            const url = `${SITE}/success?plan=base`;
            return j({ url });
        }

        const key = process.env.STRIPE_SECRET_KEY;
        if (!key) return j({ error: "Missing STRIPE_SECRET_KEY" }, 500);

        const stripe = new Stripe(key, { apiVersion: "2024-06-20" });

        const prices: PriceMap = {
            base: process.env.STRIPE_PRICE_BASE, // opzionale (se vuoi far pagare anche base)
            plus: process.env.STRIPE_PRICE_PLUS,
            pro: process.env.STRIPE_PRICE_PRO,
        };

        const priceId = prices[plan];
        if (!priceId) return j({ error: `Invalid or missing price for plan: ${plan}` }, 400);

        const session = await stripe.checkout.sessions.create({
            mode: "subscription", // usa "payment" se non vuoi abbonamenti
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${SITE}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${SITE}/pricing`,
        });

        return j({ url: session.url });
    } catch (err: any) {
        console.error("Stripe checkout error:", err);
        return j({ error: err?.message || "Internal error" }, 500);
    }
}

export async function GET() {
    return j({ error: "Use POST" }, 405);
}
