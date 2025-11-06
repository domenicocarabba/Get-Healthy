// app/api/checkout/route.ts
import Stripe from "stripe";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Plan = "base" | "plus" | "pro";
type PriceMap = Record<Plan, string | undefined>;

function j(obj: unknown, status = 200) {
    return NextResponse.json(obj, { status });
}

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({}));
        const rawPlan: string = String(body?.plan ?? "").toLowerCase();
        const plan: Plan = (["base", "plus", "pro"].includes(rawPlan) ? rawPlan : "base") as Plan;

        const SITE =
            process.env.NEXT_PUBLIC_SITE_URL ||
            new URL(req.url).origin;

        // Piano base gratuito → salta Stripe
        if (plan === "base" && !process.env.STRIPE_PRICE_BASE) {
            return j({ url: `${SITE}/success?plan=base` });
        }

        const key = process.env.STRIPE_SECRET_KEY;
        if (!key) return j({ error: "Missing STRIPE_SECRET_KEY" }, 500);

        const stripe = new Stripe(key);

        const prices: PriceMap = {
            base: process.env.STRIPE_PRICE_BASE,  // opzionale
            plus: process.env.STRIPE_PRICE_PLUS,  // richiesto per plan=plus
            pro: process.env.STRIPE_PRICE_PRO,   // richiesto per plan=pro
        };

        const priceId = prices[plan];
        if (!priceId) return j({ error: `Invalid or missing price for plan: ${plan}` }, 400);

        const session = await stripe.checkout.sessions.create({
            mode: "subscription",                       // usa "payment" se non vuoi abbonamenti
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${SITE}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${SITE}/pricing`,
            // 👇 Aggiungiamo il piano nella sessione e nella subscription
            metadata: { plan },
            subscription_data: { metadata: { plan } },
        });

        return j({ url: session.url });
    } catch (err: any) {
        console.error("Stripe checkout error:", err);
        return j({ error: err?.message ?? "Internal error" }, 500);
    }
}

export async function GET() {
    return j({ error: "Use POST" }, 405);
}
