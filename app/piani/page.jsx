// /app/piani/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/ai/supabaseClient";

export default function PianiPage() {
    const router = useRouter();
    const sb = supabaseClient();
    const [user, setUser] = useState(null);

    useEffect(() => {
        sb.auth.getUser().then(({ data }) => setUser(data?.user || null));
        const { data: { subscription } } = sb.auth.onAuthStateChange((_e, session) => {
            setUser(session?.user || null);
        });
        return () => subscription?.unsubscribe();
    }, [sb]);

    function go(plan) {
        const checkout = `/checkout?plan=${encodeURIComponent(plan)}`;
        if (!user) {
            router.push(`/signup?redirect=${encodeURIComponent(checkout)}`); // non loggato -> signup
            return;
        }
        router.push(checkout); // loggato -> checkout diretto (Stripe per plus/pro)
    }

    return (
        <div className="max-w-6xl mx-auto px-6 pt-28 pb-20">
            <h1 className="text-4xl md:text-5xl font-bold text-center mb-6">
                Scegli il tuo piano
            </h1>
            <p className="text-center text-gray-600 mb-12">
                Tutti i piani usano <b>Gemini 2.5 Flash Image Preview</b>, con limiti di token e priorità diversi.
            </p>

            <div className="grid md:grid-cols-3 gap-6">
                {/* BASE */}
                <div className="border rounded-2xl p-6 bg-white">
                    <h3 className="text-xl font-semibold mb-1">Base</h3>
                    <p className="text-gray-500 mb-4">Gratis</p>
                    <ul className="text-sm space-y-2 mb-6">
                        <li>• Accesso essenziale alla chat AI</li>
                        <li>• Modello: Gemini 2.5 Flash Image Preview</li>
                        <li>• Risposte fino a <b>512 token</b></li>
                        <li>• Tetto mensile: <b>40.000 token</b></li>
                        <li>• Ricette e consigli base</li>
                    </ul>
                    <button onClick={() => go("base")} className="w-full rounded-lg border px-4 py-2 hover:bg-gray-50">
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
                        <li>• Stesso modello Gemini</li>
                        <li>• Risposte fino a <b>1024 token</b></li>
                        <li>• Tetto mensile: <b>300.000 token</b></li>
                        <li>• Priorità più alta e più richieste al mese</li>
                        <li>• Ricette dettagliate con macro e tempi</li>
                        <li>• Cronologia chat e suggerimenti smart</li>
                    </ul>
                    <button onClick={() => go("plus")} className="w-full rounded-lg bg-green-600 text-white px-4 py-2 hover:bg-green-700">
                        Attiva Plus
                    </button>
                </div>

                {/* PRO */}
                <div className="border rounded-2xl p-6 bg-white">
                    <h3 className="text-xl font-semibold mb-1">Pro</h3>
                    <p className="text-gray-500 mb-4">€19.90 / mese</p>
                    <ul className="text-sm space-y-2 mb-6">
                        <li>• Stesso modello Gemini</li>
                        <li>• Risposte fino a <b>2048 token</b></li>
                        <li>• Tetto mensile: <b>1.000.000 token</b></li>
                        <li>• Priorità massima e tempi di risposta ridotti</li>
                        <li>• Piani alimentari personalizzati e shopping list</li>
                        <li>• Esportazione PDF / CSV e preferenze ingredienti</li>
                    </ul>
                    <button onClick={() => go("pro")} className="w-full rounded-lg bg-black text-white px-4 py-2 hover:bg-gray-900">
                        Attiva Pro
                    </button>
                </div>
            </div>
        </div>
    );
}
