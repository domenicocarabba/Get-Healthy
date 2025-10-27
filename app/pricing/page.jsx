"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PricingPage() {
    const router = useRouter();

    function choose(plan, target) {
        // MOCK: finché non colleghi Stripe/Auth.
        try {
            localStorage.setItem("gh_plan", plan);
        } catch { }
        if (target) router.push(target);
    }

    return (
        <div className="max-w-6xl mx-auto px-6 pt-28 pb-20">
            <h1 className="text-4xl md:text-5xl font-bold text-center mb-6">
                Scegli il tuo piano
            </h1>
            <p className="text-center text-gray-600 mb-12">
                Passa a PLUS o PRO per funzioni avanzate e modelli AI multipli.
            </p>

            <div className="grid md:grid-cols-3 gap-6">
                {/* BASE */}
                <div className="border rounded-2xl p-6 bg-white">
                    <h3 className="text-xl font-semibold mb-1">Base</h3>
                    <p className="text-gray-500 mb-4">Gratis</p>
                    <ul className="text-sm space-y-2 mb-6">
                        <li>• Accesso essenziale alla chat</li>
                        <li>• Modello: Gemini (standard)</li>
                        <li>• Limite richieste giornaliere</li>
                    </ul>
                    <button
                        onClick={() => choose("base", "/ai")}
                        className="w-full rounded-lg border px-4 py-2 hover:bg-gray-50"
                    >
                        Resta su Base
                    </button>
                </div>

                {/* PLUS */}
                <div className="border rounded-2xl p-6 bg-white relative">
                    <span className="absolute -top-3 right-4 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                        Consigliato
                    </span>
                    <h3 className="text-xl font-semibold mb-1">Plus</h3>
                    <p className="text-gray-500 mb-4">€9.90 / mese</p>
                    <ul className="text-sm space-y-2 mb-6">
                        <li>• Gemini + Perplexity</li>
                        <li>• Più richieste e priorità</li>
                        <li>• Ricette e piani avanzati</li>
                    </ul>
                    {/* In produzione: manda a Stripe Checkout */}
                    <button
                        onClick={() => choose("plus", "/checkout?plan=plus")}
                        className="w-full rounded-lg bg-green-600 text-white px-4 py-2 hover:bg-green-700"
                    >
                        Attiva Plus
                    </button>
                    <div className="text-center text-xs text-gray-500 mt-2">
                        Oppure{" "}
                        <Link href="/ai" className="text-green-600 underline">
                            prova la chat
                        </Link>
                    </div>
                </div>

                {/* PRO */}
                <div className="border rounded-2xl p-6 bg-white">
                    <h3 className="text-xl font-semibold mb-1">Pro</h3>
                    <p className="text-gray-500 mb-4">€19.90 / mese</p>
                    <ul className="text-sm space-y-2 mb-6">
                        <li>• ChatGPT + Gemini + Perplexity</li>
                        <li>• Priorità massima</li>
                        <li>• Limiti elevati</li>
                    </ul>
                    <button
                        onClick={() => choose("pro", "/checkout?plan=pro")}
                        className="w-full rounded-lg bg-black text-white px-4 py-2 hover:bg-gray-900"
                    >
                        Attiva Pro
                    </button>
                </div>
            </div>

            <p className="text-xs text-gray-500 text-center mt-6">
                * I prezzi sono di esempio. In produzione collega Stripe e salva il piano nel profilo utente.
            </p>
        </div>
    );
}
