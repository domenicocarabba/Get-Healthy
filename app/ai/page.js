"use client";

import { useEffect, useState } from "react";

export default function AIPage() {
    // piano utente: "base" | "plus" | "pro"
    // per ora lo prendiamo da localStorage o querystring ?plan=pro
    const [plan, setPlan] = useState("base");
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

    useEffect(() => {
        // leggi piano da querystring o localStorage
        const url = new URL(window.location.href);
        const qPlan = url.searchParams.get("plan");
        const stored = localStorage.getItem("gh_plan");
        const effective = qPlan || stored || "base";
        setPlan(effective);
    }, []);

    useEffect(() => {
        localStorage.setItem("gh_plan", plan);
    }, [plan]);

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

    return (
        <div className="container max-w-3xl mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold mb-2">Get Healthy — AI</h1>
            <p className="text-sm text-gray-500 mb-6">
                Piano attivo:{" "}
                <span className="font-semibold uppercase">{plan}</span>
            </p>

            {/* selettore piano (solo demo) */}
            <div className="mb-6 flex items-center gap-2">
                <label className="text-sm">Seleziona piano (demo):</label>
                <select
                    className="border rounded px-2 py-1"
                    value={plan}
                    onChange={(e) => setPlan(e.target.value)}
                >
                    <option value="base">Base (Gemini)</option>
                    <option value="plus">Plus (Gemini + Perplexity)</option>
                    <option value="pro">Pro (ChatGPT + Gemini + Perplexity)</option>
                </select>
            </div>

            <div className="border rounded-lg p-4 bg-white">
                <div className="space-y-4 max-h-[50vh] overflow-y-auto">
                    {messages.map((m, i) => (
                        <div
                            key={i}
                            className={
                                m.role === "user" ? "text-right" : "text-left"
                            }
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
                    Nota: i contenuti sono consigli informativi basati sulle tue preferenze,{" "}
                    <span className="font-medium">non sostituiscono pareri medici</span>.
                </p>
            </div>
        </div>
    );
}
