import Stripe from "stripe";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function j(obj: unknown, status = 200) {
  return NextResponse.json(obj, { status });
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const session_id = url.searchParams.get("session_id");
    if (!session_id) return j({ ok: false, error: "missing_session_id" }, 400);

    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) return j({ ok: false, error: "missing_secret" }, 500);

    const stripe = new Stripe(key);

    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["subscription"],
    });

    const paid =
      session.payment_status === "paid" ||
      session.status === "complete";

    const plan =
      (session.metadata?.plan as string | undefined) ||
      ((session.subscription as Stripe.Subscription | null)?.metadata?.plan as string | undefined) ||
      null;

    return j({ ok: paid, plan });
  } catch (e: any) {
    return j({ ok: false, error: e?.message ?? "verify_failed" }, 500);
  }
}
