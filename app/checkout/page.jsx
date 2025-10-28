"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function CheckoutPage() {
    const router = useRouter();
    const search = useSearchParams();
    const plan = search.get("plan") || "base";

    useEffect(() => {
        // 🧹 Rimuovi ogni piano salvato finché non pagano davvero
        try {
            localStorage.removeItem("gh_plan");
        } catch { }

        // Se piano base → salta Stripe e vai direttamente al success
        if (plan === "base") {
            router.replace(`/success?plan=base`);
            return;
        }

        async function startCheckout() {
            try {
                const res = await fetch("/api/checkout", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ plan }),
                });

                const data = await res.json();
                if (data.url) {
                    window.location.href = data.url; // 🔁 Redirect a Stripe
                } else {
                    console.error("Checkout error:", data.error);
                    alert("Errore durante il checkout: " + data.error);
                }
            } catch (err) {
                console.error(err);
                alert("Errore di rete o del server.");
            }
        }

        startCheckout();
    }, [plan, router]);

    return (
        <main className="flex flex-col items-center justify-center h-[80vh] text-center">
            <h1 className="text-3xl font-semibold mb-4">Reindirizzamento in corso…</h1>
            <p>
                Stiamo avviando il checkout per il piano <strong>{plan}</strong>.
            </p>
        </main>
    );
}
