"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { exportCSV, exportPlanPDF, shoppingListRows } from "../../lib/export.js";



// MOCK: finché non colleghi l’abbonamento reale (Stripe/Auth)
function useActivePlan() {
    const [plan, setPlan] = useState("base"); // "base" | "plus" | "pro"
    useEffect(() => {
        setPlan(localStorage.getItem("gh_plan") || "base");
    }, []);
    return plan;
}

// helper: converte immagine → base64 (data URL)
function fileToDataURL(file) {
    return new Promise((res, rej) => {
        const fr = new FileReader();
        fr.onload = () => res(String(fr.result));
        fr.onerror = rej;
        fr.readAsDataURL(file);
    });
}

// pretty print ricetta JSON → testo
function formatRecipe(r) {
    if (!r || typeof r !== "object") return "Nessuna ricetta.";
    const ing = (r.ingredients || [])
        .map((x) => `• ${x.qty ?? ""} ${x.unit ?? ""} ${x.item ?? ""}`.replace(/\s+/g, " ").trim())
        .join("\n");
    const steps = (r.steps || []).map((s, i) => `${i + 1}. ${s}`).join("\n");
    const macros = r.macros
        ? `Macro: ${r.macros.kcal ?? "-"} kcal · ${r.macros.protein_g ?? "-"}g pro · ${r.macros.carbs_g ?? "-"}g carb · ${r.macros.fat_g ?? "-"}g fat`
        : "";
    return [
        `🍽️ ${r.name || "Ricetta"}`,
        `Porzioni: ${r.servings ?? "-"}`,
        `Tempo: prep ${r.prep_minutes ?? "-"}' · cottura ${r.cook_minutes ?? "-"}'`,
        macros,
        "",
        "Ingredienti:",
        ing || "-",
        "",
        "Procedimento:",
        steps || "-",
        r.notes ? `\nNote: ${r.notes}` : "",
    ].join("\n");
}

// pretty print piano JSON → testo
function formatMealplan(p) {
    if (!p || typeof p !== "object") return "Nessun piano disponibile.";
    const days = (p.days || [])
        .map((d) => {
            const meals = (d.meals || [])
                .map((m) => `• ${m.name} — ${m.macros?.kcal ?? "-"} kcal\n  ${m.recipe || ""}`)
                .join("\n");
            return `Giorno ${d.day}\n${meals}\nTotale: ${d.total_macros?.kcal ?? "-"} kcal`;
        })
        .join("\n\n");
    const list = (p.shopping_list || [])
        .map((it) => `• ${it.item} — ${it.qty ?? ""} ${it.unit ?? ""}`.trim())
        .join("\n");
    return `📅 Piano settimanale\n\n${days}\n\n🛒 Lista della spesa\n${list || "-"}`;
}

export default function AIPage() {
    const plan = useActivePlan();

    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [files, setFiles] = useState([]); // immagini caricate
    const fileInputRef = useRef(null);

    /**
     * Messaggi arricchiti:
     * - role: "user" | "assistant"
     * - text: string
     * - type?: "plan" | "recipe" | "plain"
     * - data?: any (per "plan" contiene il JSON del piano)
     */
    const [messages, setMessages] = useState([
        {
            role: "assistant",
            text:
                "Ciao! Sono la tua AI di Get Healthy. Dimmi un obiettivo (es. 'perdi 3kg in 4 settimane') o chiedimi ricette e piani.",
            type: "plain",
        },
    ]);

    // stato uso token dal backend
    const [usage, setUsage] = useState({
        used_now: 0,
        used_month: 0,
        cap_month: 0,
        plan,
    });

    // widget sticky
    const [showUsageWidget, setShowUsageWidget] = useState(true);

    /* =======================
       CHAT TESTO + IMMAGINI
    ========================*/
    async function ask() {
        if (!input.trim() && files.length === 0) return;
        setError("");
        setLoading(true);

        const userMsg = { role: "user", text: input, type: "plain" };
        setMessages((m) => [...m, userMsg]);
        setInput("");

        try {
            // converto immagini in base64
            const images = [];
            for (const f of files.slice(0, 4)) {
                images.push(await fileToDataURL(f));
            }

            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: userMsg.text, plan, images }),
            });

            if (!res.ok) {
                let detail = "Errore di rete";
                try {
                    const j = await res.json();
                    detail = j?.error || detail;
                    if (j?.used_month && j?.cap_month) {
                        setUsage((u) => ({ ...u, used_month: j.used_month, cap_month: j.cap_month }));
                    }
                } catch { }
                if (res.status === 402) throw new Error(`${detail}. Hai raggiunto la quota mensile del tuo piano.`);
                if (res.status === 429) throw new Error(`${detail}. Hai superato il limite orario di richieste. Riprova più tardi.`);
                throw new Error(detail);
            }

            const data = await res.json();
            const reply = data?.result || "Nessuna risposta ricevuta.";
            setMessages((m) => [...m, { role: "assistant", text: reply, type: "plain" }]);
            if (data?.usage) setUsage(data.usage);
        } catch (e) {
            setError(e.message || "Errore sconosciuto");
        } finally {
            setLoading(false);
            setFiles([]);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    }

    function handleKey(e) {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) ask();
    }

    /* =======================
        AZIONI RAPIDE
       - Ricetta (Plus/Pro)
       - Piano (Pro) + EXPORT
    ========================*/
    async function quickRecipe() {
        if (plan === "base") {
            setError("Le ricette dettagliate sono disponibili da PLUS in su. Vai su /pricing per l’upgrade.");
            return;
        }
        if (!input.trim()) {
            setError("Scrivi nel box cosa vuoi per la ricetta (es. 'pollo 500 kcal alta proteine').");
            return;
        }
        setError("");
        setLoading(true);
        setMessages((m) => [...m, { role: "user", text: `Genera ricetta: ${input}`, type: "plain" }]);
        try {
            const res = await fetch("/api/recipe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ plan, brief: input, servings: 1 }),
            });
            const data = await res.json();
            if (!data.ok) throw new Error(data.error || "Errore generazione ricetta");
            const pretty = formatRecipe(data.recipe || {});
            setMessages((m) => [...m, { role: "assistant", text: pretty, type: "recipe", data: data.recipe }]);
        } catch (e) {
            setError(e.message || "Errore generazione ricetta");
        } finally {
            setLoading(false);
        }
    }

    async function quickMealplan() {
        if (plan !== "pro") {
            setError("Il piano settimanale è disponibile solo nel piano PRO. Vai su /pricing per l’upgrade.");
            return;
        }
        setError("");
        setLoading(true);
        const brief = input.trim() || "dieta equilibrata 2000 kcal, mediterranea";
        setMessages((m) => [...m, { role: "user", text: `Genera piano settimanale: ${brief}`, type: "plain" }]);
        try {
            const res = await fetch("/api/mealplan", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    plan,
                    days: 7,
                    mealsPerDay: 3,
                    prefs: { note: brief },
                }),
            });
            const data = await res.json();
            if (!data.ok) throw new Error(data.error || "Errore creazione piano");
            const pretty = formatMealplan(data.plan || {});
            // Salvo ANCHE il JSON del piano nel messaggio -> così mostro i bottoni Export
            setMessages((m) => [
                ...m,
                { role: "assistant", text: pretty, type: "plan", data: data.plan },
            ]);
        } catch (e) {
            setError(e.message || "Errore creazione piano");
        } finally {
            setLoading(false);
        }
    }

    // Azioni export attaccate al messaggio "plan"
    function handleExportPDF(planJson) {
        exportPlanPDF(planJson, "piano_settimanale.pdf");
    }
    function handleExportCSV(planJson) {
        const rows = shoppingListRows(planJson);
        if (!rows.length) return;
        exportCSV(rows, "shopping_list.csv");
    }

    const activeProviders = "Gemini (testo + immagini)";
    const pct =
        usage.cap_month > 0 ? Math.min(100, Math.round((usage.used_month / usage.cap_month) * 100)) : 0;

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
                    Gemini 2.5 Flash Image Preview · Limiti variabili per piano
                </p>

                <motion.div whileHover={{ scale: 1.08 }} className="opacity-90 hover:opacity-100 transition">
                    <Image src="/logos/gemini.svg" alt="Gemini" width={100} height={100} priority />
                </motion.div>

                <motion.div
                    className="absolute inset-0 bg-gradient-to-t from-purple-800/10 via-transparent to-blue-800/10 blur-3xl -z-10"
                    animate={{ opacity: [0.25, 0.45, 0.25] }}
                    transition={{ duration: 6, repeat: Infinity }}
                />

                <a href="#chat" className="absolute bottom-8 text-gray-300 hover:text-white transition text-sm tracking-wide">
                    Scorri giù ↓
                </a>
            </section>

            {/* ===== CHAT ===== */}
            <section id="chat" className="container max-w-3xl mx-auto px-4 py-14">
                <div className="mb-6">
                    <h2 className="text-3xl font-bold">Get Healthy — AI</h2>
                    <p className="text-sm text-gray-500">
                        Piano attivo: <span className="font-semibold uppercase">{plan}</span>
                    </p>
                    <p className="text-xs text-gray-400">Provider: {activeProviders}</p>
                </div>

                {/* Banner upgrade se piano base */}
                {plan === "base" && (
                    <div className="mb-6 rounded-lg border bg-white p-4">
                        <p className="text-sm text-gray-700">
                            Con il piano <b>BASE</b> usi <b>Gemini</b> con un limite ridotto di token. Con{" "}
                            <a href="/pricing" className="text-green-600 underline font-semibold">PLUS</a> ottieni risposte più lunghe, mentre con{" "}
                            <a href="/pricing" className="text-green-600 underline font-semibold">PRO</a> hai il massimo numero di token e priorità.
                        </p>
                    </div>
                )}

                {/* Contatore mensile + progress bar */}
                <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>Utilizzo mensile</span>
                        <span>{usage.used_month.toLocaleString()} / {usage.cap_month.toLocaleString()} token ({pct}%)</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-2 bg-green-600" style={{ width: `${pct}%` }} />
                    </div>
                </div>

                <div className="border rounded-lg p-4 bg-white">
                    <div className="space-y-4 max-h-[50vh] overflow-y-auto">
                        {messages.map((m, i) => (
                            <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
                                <div
                                    className={`inline-block px-3 py-2 rounded-lg whitespace-pre-wrap ${m.role === "user" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-900"
                                        }`}
                                >
                                    {m.text}
                                </div>

                                {/* Bottoni EXPORT se questo messaggio è un PIANO e l'utente è PRO */}
                                {m.role === "assistant" && m.type === "plan" && plan === "pro" && (
                                    <div className="mt-2 flex gap-2">
                                        <button
                                            onClick={() => handleExportPDF(m.data)}
                                            className="text-xs border rounded px-2 py-1 hover:bg-gray-50"
                                        >
                                            Scarica PDF
                                        </button>
                                        <button
                                            onClick={() => handleExportCSV(m.data)}
                                            className="text-xs border rounded px-2 py-1 hover:bg-gray-50"
                                        >
                                            Scarica CSV (lista spesa)
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                        {loading && <div className="text-sm text-gray-500">Sto pensando…</div>}
                        {error && <div className="text-sm text-red-600">{error}</div>}
                    </div>

                    {/* ===== AZIONI RAPIDE ===== */}
                    <div className="mt-4 grid gap-2 md:grid-cols-2">
                        <button
                            onClick={quickRecipe}
                            className="border rounded-lg px-3 py-2 text-sm hover:bg-gray-50 text-left"
                            title={plan === "base" ? "Disponibile da PLUS" : "Genera una ricetta dal testo nel box"}
                        >
                            🍽️ Genera Ricetta {plan === "base" && "(Plus)"}
                        </button>

                        <button
                            onClick={quickMealplan}
                            className="border rounded-lg px-3 py-2 text-sm hover:bg-gray-50 text-left"
                            title={plan !== "pro" ? "Disponibile solo in PRO" : "Crea un piano 7 giorni con 3 pasti/giorno"}
                        >
                            📅 Piano Settimanale {plan !== "pro" && "(Pro)"}
                        </button>
                    </div>

                    {/* Input + upload immagini */}
                    <div className="mt-4 flex flex-col gap-3">
                        <textarea
                            className="flex-1 border rounded px-3 py-2"
                            rows={2}
                            placeholder="Scrivi qui… es. 'ricetta proteica 500 kcal' o 'dieta mediterranea 1800 kcal'"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKey}
                        />

                        <div className="flex items-center justify-between gap-3">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) => setFiles(Array.from(e.target.files || []))}
                            />
                            <button
                                onClick={ask}
                                disabled={loading}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50"
                            >
                                Invia
                            </button>
                        </div>

                        {files.length > 0 && (
                            <div className="flex gap-2 mt-2 flex-wrap">
                                {files.map((f, i) => (
                                    <img
                                        key={i}
                                        src={URL.createObjectURL(f)}
                                        alt={`img-${i}`}
                                        className="w-16 h-16 object-cover rounded border"
                                    />
                                ))}
                            </div>
                        )}

                        <p className="text-xs text-gray-500 mt-2">
                            Nota: i contenuti sono informativi e non sostituiscono pareri medici.
                        </p>
                    </div>
                </div>
            </section>

            {/* ===== STICKY USAGE WIDGET ===== */}
            {showUsageWidget && usage.cap_month > 0 && (
                <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 pointer-events-none">
                    <div className="max-w-md w-full rounded-xl shadow-lg bg-white border p-3 pointer-events-auto">
                        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                            <span>Token rimasti</span>
                            <span>
                                {(usage.cap_month - usage.used_month).toLocaleString()} / {usage.cap_month.toLocaleString()}
                            </span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className={`h-2 ${pct >= 85 ? "bg-red-500" : pct >= 60 ? "bg-amber-500" : "bg-green-600"}`}
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                            <span className="text-[11px] text-gray-500">
                                Piano: <b>{plan.toUpperCase()}</b> · usati {usage.used_month.toLocaleString()}
                            </span>
                            <div className="flex items-center gap-3">
                                {(usage.cap_month - usage.used_month) <= Math.max(1000, usage.cap_month * 0.1) && (
                                    <a href="/pricing" className="text-xs font-medium text-green-700 underline">Upgrade</a>
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
