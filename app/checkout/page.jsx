"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseClient } from "@/lib/ai/supabaseClient";

export default function CheckoutPage() {
    const router = useRouter();
    const search = useSearchParams();
    const plan = (search.get("plan") || "base").toLowerCase();
    const sb = supabaseClient();

    useEffect(() => {
        (async () => {
            // 1) must be logged in
            const { data } = await sb.auth.getUser();
            if (!data?.user) {
                const here = `/checkout?plan=${encodeURIComponent(plan)}`;
                router.replace(`/signup?redirect=${encodeURIComponent(here)}`);
                return;
            }

            // 2) base -> niente Stripe
            if (plan === "base") {
                router.replace("/success?plan=base");
                return;
            }

            // 3) plus/pro -> chiama la tua API
            try {
                const res = await fetch("/api/checkout", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ plan }),
                });
                const json = await res.json();
                if (json?.url) {
                    window.location.href = json.url;
                } else {
                    alert(json?.error || "Errore durante il checkout");
                    router.replace("/plan");
                }
            } catch {
                alert("Errore di rete durante il checkout");
                router.replace("/plan");
            }
        })();
    }, [plan, router, sb]);

    return (
        <main className="max-w-xl mx-auto px-6 pt-28 pb-20 text-center">
            <h1 className="text-2xl font-semibold mb-2">Reindirizzamento al pagamento…</h1>
            <p className="text-gray-600">Attendi qualche istante.</p>
        </main>
    );
}
