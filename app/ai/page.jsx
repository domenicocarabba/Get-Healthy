"use client";

import { useEffect, useRef, useState } from "react";
import { supabaseClient } from "@/lib/ai/supabaseClient";
import { motion } from "framer-motion";

export default function AIPage() {
    const sb = supabaseClient();

    // UI / stato
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");

    // Dati account / chat
    const [profile, setProfile] = useState({ email: "" });
    const [threads, setThreads] = useState([]);
    const [selectedThread, setSelectedThread] = useState(null);

    // Messaggi del thread selezionato
    const [messages, setMessages] = useState([]);

    // Input utente
    const [message, setMessage] = useState("");
    const textareaRef = useRef(null);
    const transcriptEndRef = useRef(null);

    // ---------- Helpers ----------
    function scrollToEnd() {
        transcriptEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }

    async function loadThreads() {
        setErr("");
        setBusy(true);
        try {
            const res = await fetch("/api/ai/threads", {
                method: "GET",
                headers: { accept: "application/json" },
                cache: "no-store",
            });
            const text = await res.text();
            if (!res.ok) throw new Error(`GET /api/ai/threads ${res.status}: ${text}`);
            const data = text ? JSON.parse(text) : {};
            setThreads(data.threads || []);
            if ((data.threads || []).length && !selectedThread) {
                setSelectedThread(data.threads[0]);
            }
        } catch (e) {
            console.error(e);
            alert(e.message);
        } finally {
            setBusy(false);
        }
    }

    async function loadMessages(tid) {
        if (!tid) return setMessages([]);
        try {
            const res = await fetch(`/api/ai/messages?thread_id=${tid}`, { cache: "no-store" });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || "Errore caricamento messaggi");
            setMessages(data.messages || []);
            scrollToEnd();
        } catch (e) {
            console.error(e);
            alert(e.message);
        }
    }

    async function newThread() {
        setErr("");
        setBusy(true);
        try {
            const res = await fetch("/api/ai/thread", {
                method: "POST",
                headers: { "content-type": "application/json", accept: "application/json" },
                body: JSON.stringify({}),
            });
            const text = await res.text();
            if (!res.ok) throw new Error(`POST /api/ai/thread ${res.status}: ${text}`);
            const data = text ? JSON.parse(text) : {};
            await loadThreads();
            if (data.thread) {
                setSelectedThread(data.thread);
                await loadMessages(data.thread.id);
            }
        } catch (e) {
            console.error(e);
            alert(e.message);
        } finally {
            setBusy(false);
        }
    }

    async function regenerateWeek() {
        // Collega qui la tua /api/plan (stub per ora)
        alert("Rigenerazione settimana: collega la tua API /api/ai/plan.");
    }

    async function sendMessage() {
        if (!message.trim()) return;

        // crea thread al volo se non esiste
        let tid = selectedThread?.id;
        if (!tid) {
            const r = await fetch("/api/ai/thread", { method: "POST" });
            const d = await r.json();
            if (!r.ok) return alert(d?.error || "Errore creazione thread");
            tid = d.thread.id;
            setSelectedThread(d.thread);
            await loadThreads();
            await loadMessages(tid);
        }

        // optimistic UI
        const optimistic = {
            id: "tmp-" + Date.now(),
            role: "user",
            content: message,
            created_at: new Date().toISOString(),
        };
        setMessages((m) => [...m, optimistic]);
        const txt = message;
        setMessage("");
        textareaRef.current?.focus();
        scrollToEnd();

        // chiamata reale all'AI
        const res = await fetch("/api/ai/message", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ thread_id: tid, content: txt }),
        });
        const data = await res.json();

        if (!res.ok) {
            // rollback
            setMessages((m) => m.filter((x) => x.id !== optimistic.id));
            return alert(data?.error || "Errore invio");
        }

        setMessages((m) =>
            m.filter((x) => x.id !== optimistic.id).concat([data.user, data.assistant])
        );
        scrollToEnd();
    }

    function onTextareaKey(e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            void sendMessage();
        }
    }

    // ---------- Bootstrap: sessione + threads ----------
    useEffect(() => {
        let unsub = null;

        (async () => {
            try {
                setErr("");

                const { data } = await sb.auth.getUser();
                const email = data?.user?.email || "";
                setProfile((p) => ({ ...p, email }));

                const sub = sb.auth.onAuthStateChange((_e, session) => {
                    const e = session?.user?.email || "";
                    setProfile((p) => ({ ...p, email: e }));
                    loadThreads();
                    setMessages([]);
                });
                unsub = sub.data.subscription;

                await loadThreads();
            } catch (e) {
                setErr(e.message || "Errore");
            } finally {
                setLoading(false);
            }
        })();

        return () => unsub?.unsubscribe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sb]);

    // al cambio thread carica la history
    useEffect(() => {
        if (selectedThread?.id) loadMessages(selectedThread.id);
        else setMessages([]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedThread?.id]);

    if (loading) return <div className="text-center pt-24 text-gray-400">Caricamento…</div>;
    if (err) return <div className="text-center pt-24 text-red-400">{String(err)}</div>;

    return (
        <main className="max-w-6xl mx-auto px-6 py-20">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <h1 className="text-3xl font-bold mb-2 text-emerald-400">Le tue chat</h1>
                {profile.email && (
                    <p className="text-gray-500 mb-8">
                        Benvenuto, <span className="font-semibold">{profile.email}</span>
                    </p>
                )}

                <div className="grid md:grid-cols-3 gap-6">
                    {/* Sidebar */}
                    <div className="bg-gray-900/60 border border-white/10 rounded-2xl p-5 shadow-lg">
                        <h2 className="text-lg font-semibold mb-4">Le tue chat</h2>

                        <button
                            onClick={newThread}
                            disabled={busy}
                            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white py-2 rounded-lg transition"
                        >
                            + Nuova chat
                        </button>

                        <div className="mt-4 space-y-2">
                            {threads.length === 0 && (
                                <div className="bg-white/5 p-3 rounded-lg text-gray-400">Nessuna chat</div>
                            )}
                            {threads.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => { setSelectedThread(t); }}
                                    className={`w-full text-left p-3 rounded-lg transition ${selectedThread?.id === t.id ? "bg-white/10" : "bg-white/5 hover:bg-white/10"
                                        }`}
                                >
                                    {t.title || "Nuova chat"}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Main */}
                    <div className="md:col-span-2 bg-gray-900/60 border border-white/10 rounded-2xl p-6 shadow-lg">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-semibold text-white">{selectedThread?.title || "Nuova chat"}</h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={loadThreads}
                                    disabled={busy}
                                    className="px-3 py-1 text-sm bg-white/10 hover:bg-white/20 rounded-lg transition disabled:opacity-60"
                                >
                                    Aggiorna
                                </button>
                                <button
                                    onClick={regenerateWeek}
                                    disabled={busy}
                                    className="px-3 py-1 text-sm bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition disabled:opacity-60"
                                >
                                    Rigenera settimana
                                </button>
                            </div>
                        </div>

                        {/* Transcript */}
                        <div className="mb-4 space-y-2 max-h-80 overflow-auto pr-2">
                            {messages.length === 0 && (
                                <div className="text-gray-500">Nessun messaggio</div>
                            )}
                            {messages.map((m) => (
                                <div
                                    key={m.id}
                                    className={`p-2 rounded ${m.role === "user" ? "bg-white/10 text-white" : "bg-emerald-500/10 text-emerald-200"
                                        }`}
                                >
                                    <div className="text-xs opacity-70 mb-1">{m.role}</div>
                                    <div className="whitespace-pre-wrap">{m.content}</div>
                                </div>
                            ))}
                            <div ref={transcriptEndRef} />
                        </div>

                        {/* Composer */}
                        <textarea
                            ref={textareaRef}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={onTextareaKey}
                            placeholder="Scrivi un messaggio (Invio per inviare, Shift+Invio per andare a capo)…"
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-3"
                            rows={3}
                        />
                        <button
                            onClick={sendMessage}
                            disabled={busy || !message.trim()}
                            className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white px-6 py-2 rounded-lg transition"
                        >
                            Invia
                        </button>
                    </div>
                </div>
            </motion.div>
        </main>
    );
}
