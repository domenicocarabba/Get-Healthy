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
                const { error } = await res.json().catch(() => ({ error: "Errore" }));
                throw new Error(error || "Errore di rete");
            }

            const data = await res.json();
            const reply = data?.result || "Nessuna risposta ricevuta.";
            setMessages((m) => [...m, { role: "assistant", text: reply }]);
        } catch (e) {
            setError(e.message || "Errore sconosciuto");
        } finally {
            setLoading(false);
        }
    }

    function handleKey(e) {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) ask();
    }

    // 👇 Mostra provider attivi per ogni piano
    const activeProviders =
        plan === "base"
            ? "Gemini"
            : plan === "plus"
                ? "Gemini + ChatGPT"
                : "Gemini + ChatGPT + Perplexity";

    return (
        <div className="min-h-screen">
            {/* ===== HERO fissa in cima ===== */}
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
                    Powered by the best in{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                        AI
                    </span>
                </motion.h1>

                {/* Sottotitolo */}
                <p className="mt-2 text-sm text-gray-400 tracking-widest mb-10">
                    ChatGPT • Gemini • Perplexity
                </p>

                {/* ===== LOGHI LOCALI ===== */}
                <div className="flex space-x-12 md:space-x-24 items-center">
                    <motion.div
                        whileHover={{ scale: 1.08 }}
                        className="opacity-80 hover:opacity-100 transition"
                    >
                        <Image
                            src="/logos/chatgpt.svg"
                            alt="ChatGPT"
                            width={84}
                            height={84}
                            priority
                        />
                    </motion.div>

                    <motion.div
                        whileHover={{ scale: 1.08 }}
                        className="opacity-80 hover:opacity-100 transition"
                    >
                        <Image
                            src="/logos/gemini.svg"
                            alt="Gemini"
                            width={84}
                            height={84}
                        />
                    </motion.div>

                    <motion.div
                        whileHover={{ scale: 1.08 }}
                        className="opacity-80 hover:opacity-100 transition"
                    >
                        <Image
                            src="/logos/perplexity.svg"
                            alt="Perplexity AI"
                            width={84}
                            height={84}
                        />
                    </motion.div>
                </div>

                {/* Sfondo sfumato animato */}
                <motion.div
                    className="absolute inset-0 bg-gradient-to-t from-purple-800/10 via-transparent to-blue-800/10 blur-3xl -z-10"
                    animate={{ opacity: [0.25, 0.45, 0.25] }}
                    transition={{ duration: 6, repeat: Infinity }}
                />

                {/* Scroll hint */}
                <a
                    href="#chat"
                    className="absolute bottom-8 text-gray-300 hover:text-white transition text-sm tracking-wide"
                >
                    Scorri giù ↓
                </a>
            </section>

            {/* ===== SEZIONE CHAT ===== */}
            <section id="chat" className="container max-w-3xl mx-auto px-4 py-14">
                <div className="mb-6">
                    <h2 className="text-3xl font-bold">Get Healthy — AI</h2>
                    <p className="text-sm text-gray-500">
                        Piano attivo:{" "}
                        <span className="font-semibold uppercase">{plan}</span>
                    </p>
                    <p className="text-xs text-gray-400">
                        Provider attivi: {activeProviders}
                    </p>
                </div>

                {/* Banner upgrade se piano base */}
                {plan === "base" && (
                    <div className="mb-6 rounded-lg border bg-white p-4">
                        <p className="text-sm text-gray-700">
                            Con il piano <b>BASE</b> usi solo <b>Gemini</b> (funzionalità essenziali).{" "}
                            Con il piano{" "}
                            <a href="/pricing" className="text-green-600 underline font-semibold">
                                PLUS
                            </a>{" "}
                            usi <b>Gemini + ChatGPT</b>, e con il piano{" "}
                            <a href="/pricing" className="text-green-600 underline font-semibold">
                                PRO
                            </a>{" "}
                            hai accesso completo a <b>Gemini + ChatGPT + Perplexity</b>.
                        </p>
                    </div>
                )}

                <div className="border rounded-lg p-4 bg-white">
                    <div className="space-y-4 max-h-[50vh] overflow-y-auto">
                        {messages.map((m, i) => (
                            <div
                                key={i}
                                className={m.role === "user" ? "text-right" : "text-left"}
                            >
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
                        {loading && (
                            <div className="text-sm text-gray-500">Sto pensando…</div>
                        )}
                        {error && (
                            <div className="text-sm text-red-600">Errore: {error}</div>
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
                        Nota: i contenuti sono consigli informativi basati sulle tue
                        preferenze,{" "}
                        <span className="font-medium">
                            non sostituiscono pareri medici
                        </span>
                        .
                    </p>
                </div>
            </section>
        </div>
    );
}
