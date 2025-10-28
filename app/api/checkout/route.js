import Stripe from "stripe";
import { NextResponse } from "next/server";

export const runtime = "nodejs"; // ✅ required for Stripe (not edge)

function j(obj, status = 200) {
    return NextResponse.json(obj, { status });
}

export async function POST(req) {
    try {
        const body = await req.json();
        const plan = (body?.plan || "").toLowerCase();

        if (!process.env.STRIPE_SECRET_KEY) return j({ error: "Missing STRIPE_SECRET_KEY" }, 500);

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

        const priceMap = {
            plus: process.env.STRIPE_PRICE_PLUS,
            pro: process.env.STRIPE_PRICE_PRO,
        };
        const priceId = priceMap[plan];
        if (!priceId) return j({ error: `Invalid plan: ${plan}` }, 400);

        const success = `${process.env.NEXT_PUBLIC_SITE_URL}/success?plan=${plan}`;
        const cancel = `${process.env.NEXT_PUBLIC_SITE_URL}/pricing`;

        const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: success,
            cancel_url: cancel,
        });

        return j({ url: session.url });
    } catch (err) {
        console.error("Stripe checkout error:", err);
        return j({ error: err?.message || "Internal error" }, 500);
    }
}

export async function GET() {
    return NextResponse.json({ error: "Use POST" }, { status: 405 });
}
