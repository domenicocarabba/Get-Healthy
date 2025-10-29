// app/ai/page.jsx
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

// MOCK: finché non colleghi l’abbonamento reale (Stripe/Auth)
function useActivePlan() {
    const [plan, setPlan] = useState("base"); // "base" | "plus" | "pro"
    useEffect(() => {
        setPlan(localStorage.getItem("gh_plan") || "base");
    }, []);
    return plan;
}

export default function AIPage() {
    const plan = useActivePlan();

    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [messages, setMessages] = useState([
        {
            role: "assistant",
            text:
                "Ciao! Sono la tua AI di Get Healthy. Dimmi un obiettivo (es. 'perdi 3kg in 4 settimane') o chiedimi ricette e piani.",
        },
    ]);

    // stato uso token dal backend
    const [usage, setUsage] = useState({
        used_now: 0,
        used_month: 0,
        cap_month: 0,
        plan,
    });

    // ✅ Aggiunta 1: stato per mostrare/nascondere il widget sticky
    const [showUsageWidget, setShowUsageWidget] = useState(true);

    async function ask() {
        if (!input.trim()) return;
        setError("");
        setLoading(true);
        const userMsg = { role: "user", text: input };
        setMessages((m) => [...m, userMsg]);
        setInput("");

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: userMsg.text, plan }),
            });

            if (!res.ok) {
                let detail = "Errore di rete";
                try {
                    const j = await res.json();
                    detail = j?.error || detail;
                    if (j?.used_month && j?.cap_month) {
                        setUsage((u) => ({
                            ...u,
                            used_month: j.used_month,
                            cap_month: j.cap_month,
                        }));
                    }
                } catch { }
                if (res.status === 402) {
                    throw new Error(
                        `${detail}. Hai raggiunto la quota mensile del tuo piano.`
                    );
                }
                if (res.status === 429) {
                    throw new Error(
                        `${detail}. Hai superato il limite orario di richieste. Riprova più tardi.`
                    );
                }
                throw new Error(detail);
            }

            const data = await res.json();
            const reply = data?.result || "Nessuna risposta ricevuta.";
            setMessages((m) => [...m, { role: "assistant", text: reply }]);

            if (data?.usage) setUsage(data.usage);
        } catch (e) {
            setError(e.message || "Errore sconosciuto");
        } finally {
            setLoading(false);
        }
    }

    function handleKey(e) {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) ask();
    }

    const activeProviders = "Gemini (limiti variabili per piano)";

    // util per progress bar
    const pct =
        usage.cap_month > 0
            ? Math.min(100, Math.round((usage.used_month / usage.cap_month) * 100))
            : 0;

    return (
        <div className="min-h-screen">
            {/* ===== HERO ===== */}
            <section className="relative min-h-[100svh] flex flex-col items-center justify-center bg-black text-white text-center overflow-hidden">
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="absolute top-10 text-sm tracking-widest text-gray-400 uppercase"
                >
                    Get Healthy AI
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1 }}
                    className="text-4xl md:text-6xl font-bold mb-10"
                >
                    Powered by{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                        Gemini
                    </span>
                </motion.h1>

                <p className="mt-2 text-sm text-gray-400 tracking-widest mb-10">
                    Solo Gemini • limiti diversi per piano
                </p>

                <motion.div
                    whileHover={{ scale: 1.08 }}
                    className="opacity-90 hover:opacity-100 transition"
                >
                    <Image
                        src="/logos/gemini.svg"
                        alt="Gemini"
                        width={100}
                        height={100}
                        priority
                    />
                </motion.div>

                <motion.div
                    className="absolute inset-0 bg-gradient-to-t from-purple-800/10 via-transparent to-blue-800/10 blur-3xl -z-10"
                    animate={{ opacity: [0.25, 0.45, 0.25] }}
                    transition={{ duration: 6, repeat: Infinity }}
                />

                <a
                    href="#chat"
                    className="absolute bottom-8 text-gray-300 hover:text-white transition text-sm tracking-wide"
                >
                    Scorri giù ↓
                </a>
            </section>

            {/* ===== CHAT ===== */}
            <section id="chat" className="container max-w-3xl mx-auto px-4 py-14">
                <div className="mb-6">
                    <h2 className="text-3xl font-bold">Get Healthy — AI</h2>
                    <p className="text-sm text-gray-500">
                        Piano attivo:{" "}
                        <span className="font-semibold uppercase">{plan}</span>
                    </p>
                    <p className="text-xs text-gray-400">Provider attivi: {activeProviders}</p>
                </div>

                {/* Banner upgrade se piano base */}
                {plan === "base" && (
                    <div className="mb-6 rounded-lg border bg-white p-4">
                        <p className="text-sm text-gray-700">
                            Con il piano <b>BASE</b> usi <b>Gemini</b> con un limite ridotto di
                            token. Con{" "}
                            <a href="/pricing" className="text-green-600 underline font-semibold">
                                PLUS
                            </a>{" "}
                            ottieni risposte più lunghe, mentre con{" "}
                            <a href="/pricing" className="text-green-600 underline font-semibold">
                                PRO
                            </a>{" "}
                            hai il massimo numero di token e priorità.
                        </p>
                    </div>
                )}

                {/* Contatore mensile + progress bar */}
                <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>Utilizzo mensile</span>
                        <span>
                            {usage.used_month.toLocaleString()} /{" "}
                            {usage.cap_month.toLocaleString()} token ({pct}%)
                        </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-2 bg-green-600"
                            style={{ width: `${pct}%` }}
                        />
                    </div>
                </div>

                <div className="border rounded-lg p-4 bg-white">
                    <div className="space-y-4 max-h-[50vh] overflow-y-auto">
                        {messages.map((m, i) => (
                            <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
                                <div
                                    className={`inline-block px-3 py-2 rounded-lg whitespace-pre-wrap ${m.role === "user"
                                        ? "bg-green-600 text-white"
                                        : "bg-gray-100 text-gray-900"
                                        }`}
                                >
                                    {m.text}
                                </div>
                            </div>
                        ))}
                        {loading && <div className="text-sm text-gray-500">Sto pensando…</div>}

                        {error && (
                            <div className="text-sm text-red-600">
                                {error}{" "}
                                {(error.includes("quota") || error.includes("Quota")) && (
                                    <>
                                        —{" "}
                                        <a
                                            href="/pricing"
                                            className="underline text-green-700 font-medium"
                                        >
                                            passa a Plus/Pro
                                        </a>
                                        .
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="mt-4 flex gap-2">
                        <textarea
                            className="flex-1 border rounded px-3 py-2"
                            rows={2}
                            placeholder="Scrivi qui la tua richiesta… (Cmd/Ctrl+Invio per inviare)"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKey}
                        />
                        <button
                            onClick={ask}
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50"
                        >
                            Invia
                        </button>
                    </div>

                    <p className="text-xs text-gray-500 mt-3">
                        Nota: i contenuti sono consigli informativi basati sulle tue preferenze,{" "}
                        <span className="font-medium">non sostituiscono pareri medici</span>.
                    </p>
                </div>
            </section>

            {/* ===== STICKY USAGE WIDGET ===== */}
            {showUsageWidget && usage.cap_month > 0 && (
                <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 pointer-events-none">
                    <div className="max-w-md w-full rounded-xl shadow-lg bg-white border p-3 pointer-events-auto">
                        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                            <span>Token rimasti</span>
                            <span>
                                {(usage.cap_month - usage.used_month).toLocaleString()} /{" "}
                                {usage.cap_month.toLocaleString()}
                            </span>
                        </div>

                        {/* progress bar del widget (usa semaforo colori) */}
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className={`h-2 ${pct >= 85 ? "bg-red-500" : pct >= 60 ? "bg-amber-500" : "bg-green-600"
                                    }`}
                                style={{ width: `${pct}%` }}
                            />
                        </div>

                        <div className="mt-2 flex items-center justify-between">
                            <span className="text-[11px] text-gray-500">
                                Piano: <b>{plan.toUpperCase()}</b> · usati {usage.used_month.toLocaleString()}
                            </span>

                            <div className="flex items-center gap-3">
                                {(usage.cap_month - usage.used_month) <= Math.max(1000, usage.cap_month * 0.1) && (
                                    <a href="/pricing" className="text-xs font-medium text-green-700 underline">
                                        Upgrade
                                    </a>
                                )}
                                <button
                                    onClick={() => setShowUsageWidget(false)}
                                    className="text-xs text-gray-500 hover:text-gray-700"
                                    aria-label="Chiudi"
                                    title="Chiudi"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
