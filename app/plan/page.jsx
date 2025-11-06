"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/ai/supabaseClient";
import { PLAN_INFO } from "@/lib/ai/plans.js"; // nuova import per testo e limiti

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
            router.push(`/signup?redirect=${encodeURIComponent(checkout)}`);
            return;
        }
        router.push(checkout);
    }

    return (
        <div className="max-w-6xl mx-auto px-6 pt-28 pb-20">
            <h1 className="text-4xl md:text-5xl font-bold text-center mb-6">
                Scegli il tuo piano
            </h1>
            <p className="text-center text-gray-600 mb-12">
                Tutti i piani usano lo stesso modello AI{" "}
                <b>Gemini 2.5 Flash Image Preview</b>,
                con limiti e funzioni diversi.
            </p>

            <div className="grid md:grid-cols-3 gap-6">
                {/* BASE */}
                <div className="border rounded-2xl p-6 bg-white">
                    <h3 className="text-xl font-semibold mb-1">{PLAN_INFO.base.name}</h3>
                    <p className="text-gray-500 mb-4">{PLAN_INFO.base.price}</p>
                    <ul className="text-sm space-y-2 mb-6">
                        {PLAN_INFO.base.features.map((f, i) => (
                            <li key={i}>• {f}</li>
                        ))}
                    </ul>
                    <button
                        onClick={() => go("base")}
                        className="w-full rounded-lg border px-4 py-2 hover:bg-gray-50"
                    >
                        Resta su Base
                    </button>
                </div>

                {/* PLUS */}
                <div className="border rounded-2xl p-6 bg-white relative">
                    <span className="absolute -top-3 right-4 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">
                        Consigliato
                    </span>
                    <h3 className="text-xl font-semibold mb-1">{PLAN_INFO.plus.name}</h3>
                    <p className="text-gray-500 mb-4">{PLAN_INFO.plus.price}</p>
                    <ul className="text-sm space-y-2 mb-6">
                        {PLAN_INFO.plus.features.map((f, i) => (
                            <li key={i}>• {f}</li>
                        ))}
                    </ul>
                    <button
                        onClick={() => go("plus")}
                        className="w-full rounded-lg bg-emerald-600 text-white px-4 py-2 hover:bg-emerald-700"
                    >
                        Attiva Plus
                    </button>
                </div>

                {/* PRO */}
                <div className="border rounded-2xl p-6 bg-white">
                    <h3 className="text-xl font-semibold mb-1">{PLAN_INFO.pro.name}</h3>
                    <p className="text-gray-500 mb-4">{PLAN_INFO.pro.price}</p>
                    <ul className="text-sm space-y-2 mb-6">
                        {PLAN_INFO.pro.features.map((f, i) => (
                            <li key={i}>• {f}</li>
                        ))}
                    </ul>
                    <button
                        onClick={() => go("pro")}
                        className="w-full rounded-lg bg-black text-white px-4 py-2 hover:bg-gray-900"
                    >
                        Attiva Pro
                    </button>
                </div>
            </div>

            <p className="text-center text-gray-400 text-sm mt-10">
                * Tutte le funzioni AI sono a scopo informativo. Non sostituiscono il
                parere di un professionista sanitario.
            </p>
        </div>
    );
}
