"use client";

import AIHomeButtons from "./AIHomeButtons";

import { useEffect, useState, useRef } from "react";

/**
 * Componente principale per l’interfaccia AI (chat + sidebar + “Oggi”)
 */
export default function AIHome() {
  const [threads, setThreads] = useState([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [selectedId, setSelectedId] = useState(null);

  const [messages, setMessages] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const [err, setErr] = useState("");
  const [usage, setUsage] = useState(null); // mostra limiti token

  // ---- Stato per piano “Oggi”
  const [today, setToday] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [planErr, setPlanErr] = useState("");

  const bottomRef = useRef(null);

  // scroll automatico
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // carica threads e “oggi” all’avvio
  useEffect(() => {
    loadThreads();
    loadToday();
  }, []);

  async function loadThreads() {
    setErr("");
    setLoadingThreads(true);
    try {
      const res = await fetch("/api/ai/threads", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Errore caricamento chat");
      setThreads(data.threads || []);
      if (!selectedId && data.threads?.length > 0) {
        handleSelect(data.threads[0].id);
      }
    } catch (e) {
      setErr(e.message || "Errore caricamento chat");
    } finally {
      setLoadingThreads(false);
    }
  }

  async function handleSelect(threadId) {
    setSelectedId(threadId);
    setMessages([]);
    setLoadingHistory(true);
    setErr("");
    try {
      const res = await fetch(`/api/ai/history/${threadId}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore history");
      setMessages(data.messages || []);
    } catch (e) {
      setErr(e.message || "Errore caricamento conversazione");
    } finally {
      setLoadingHistory(false);
    }
  }

  async function newThread() {
    setErr("");
    try {
      const res = await fetch("/api/ai/thread", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Errore creazione chat");
      const thread = data.thread;
      setThreads((t) => [thread, ...t]);
      handleSelect(thread.id);
    } catch (e) {
      setErr(e.message || "Errore creazione chat");
    }
  }

  async function send() {
    if (!selectedId || !input.trim() || sending) return;
    const text = input.trim();
    setSending(true);
    setErr("");

    // UI ottimistica
    const userMsg = {
      id: `temp-user-${Date.now()}`,
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId: selectedId, prompt: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore AI");

      const aiMsg = {
        id: `temp-ai-${Date.now()}`,
        role: "assistant",
        content: data.reply || "",
        created_at: new Date().toISOString(),
      };
      setMessages((m) => [...m, aiMsg]);

      // aggiorna usage
      setUsage({
        tokens: data.tokens_used_now,
        limit: data.token_limit,
        model: data.model,
      });
    } catch (e) {
      setErr(e.message || "Errore invio messaggio");
      // tentativo di recupero
      try {
        const r = await fetch(`/api/ai/history/${selectedId}`, { cache: "no-store" });
        const j = await r.json();
        if (r.ok) setMessages(j.messages || []);
      } catch { }
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  // ------------------- Piano “Oggi” -------------------

  async function loadToday() {
    setPlanErr("");
    try {
      // Endpoint atteso: GET /api/plan/today -> { today: DayPlan }
      const res = await fetch("/api/plan/today", { cache: "no-store" });
      if (!res.ok) {
        // Se l’endpoint non esiste ancora, non blocchiamo la UI
        setToday(null);
        return;
      }
      const data = await res.json();
      setToday(data?.today || null);
    } catch (e) {
      setPlanErr(e.message || "Errore caricamento piano");
      setToday(null);
    }
  }

  async function generateUnifiedPlan() {
    setGenerating(true);
    setPlanErr("");
    try {
      // POST /api/plan genera e salva il piano settimanale
      const res = await fetch("/api/plan", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Errore generazione piano");
      // Dopo la generazione ricarico “oggi”
      await loadToday();
    } catch (e) {
      setPlanErr(e.message || "Errore generazione piano");
    } finally {
      setGenerating(false);
    }
  }

  async function sendFeedback(item_type, item_id, value, reason = "") {
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_type, item_id, value, reason }),
      });
    } catch {
      /* non bloccare la UI */
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
      {/* SIDEBAR */}
      <aside className="md:h-[70vh] border rounded-xl p-3 overflow-auto">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Le tue chat</h2>
          <button
            onClick={newThread}
            className="bg-black text-white px-3 py-1.5 rounded hover:bg-gray-800 transition"
          >
            + Nuova
          </button>
        </div>
        <AIHomeButtons />


        {loadingThreads && <p className="text-sm text-gray-500">Caricamento…</p>}
        {err && <p className="text-sm text-red-600">{err}</p>}
        {!loadingThreads && threads.length === 0 && (
          <p className="text-sm text-gray-600">
            Nessuna chat ancora. Crea la tua prima conversazione!
          </p>
        )}

        <ul className="mt-2 space-y-1">
          {threads.map((t) => {
            const active = selectedId === t.id;
            return (
              <li key={t.id}>
                <button
                  onClick={() => handleSelect(t.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg border transition ${active ? "bg-gray-900 text-white border-gray-900" : "hover:bg-gray-100"
                    }`}
                >
                  {t.title || "Nuova chat"}
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* AREA CHAT */}
      <section className="md:h-[70vh] border rounded-xl flex flex-col">
        {/* Header “Oggi” */}
        <div className="border-b p-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold">Oggi</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={loadToday}
                className="px-3 py-1.5 rounded-lg border hover:bg-gray-50"
                title="Ricarica piano del giorno"
              >
                Aggiorna
              </button>
              <button
                onClick={generateUnifiedPlan}
                disabled={generating}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                title="Genera/rigenera la settimana"
              >
                {generating ? "Genero…" : "Rigenera settimana"}
              </button>
            </div>
          </div>

          {planErr && <p className="text-sm text-red-600 mt-2">{planErr}</p>}

          {/* Card contenuto di oggi */}
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {/* Workout */}
            <div className="rounded-xl border p-3">
              <p className="font-medium mb-1">Workout</p>
              {today?.workout ? (
                <>
                  <p className="text-sm">
                    {today.workout.title} • ~{today.workout.estTime}′
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => sendFeedback("workout", today.workout.id || "today", 1)}
                      className="text-sm rounded border px-2 py-1 hover:bg-gray-50"
                    >
                      👍
                    </button>
                    <button
                      onClick={() => sendFeedback("workout", today.workout.id || "today", -1)}
                      className="text-sm rounded border px-2 py-1 hover:bg-gray-50"
                    >
                      👎
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-600">Nessun allenamento oggi</p>
              )}
            </div>

            {/* Pasti */}
            <div className="rounded-xl border p-3">
              <p className="font-medium mb-1">Pasti</p>
              {today?.meals ? (
                <ul className="text-sm space-y-1">
                  {Object.entries(today.meals)
                    .filter(([, v]) => !!v)
                    .map(([k, v]) => {
                      const m = v; // Meal
                      return (
                        <li key={k} className="flex items-center justify-between gap-2">
                          <span className="capitalize">
                            {k}: {m.title}
                          </span>
                          <span className="text-gray-500">{Math.round(m.kcal)} kcal</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => sendFeedback("recipe", m.id || k, 1)}
                              className="text-xs rounded border px-2 py-0.5 hover:bg-gray-50"
                              title="Mi piace"
                            >
                              👍
                            </button>
                            <button
                              onClick={() => sendFeedback("recipe", m.id || k, -1)}
                              className="text-xs rounded border px-2 py-0.5 hover:bg-gray-50"
                              title="Non mi piace"
                            >
                              👎
                            </button>
                          </div>
                        </li>
                      );
                    })}
                </ul>
              ) : (
                <p className="text-sm text-gray-600">Nessun pasto disponibile</p>
              )}
            </div>
          </div>
        </div>

        {/* Messaggi */}
        <div className="flex-1 overflow-auto p-4">
          {!selectedId && (
            <div className="h-full grid place-items-center text-gray-500">
              <p>Seleziona una chat o creane una nuova per iniziare.</p>
            </div>
          )}

          {selectedId && loadingHistory && (
            <p className="text-sm text-gray-500">Carico la conversazione…</p>
          )}

          {selectedId && !loadingHistory && (
            <div className="space-y-3">
              {messages.map((m) => (
                <MessageBubble key={m.id} role={m.role} content={m.content} />
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t p-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex gap-2"
          >
            <textarea
              className="flex-1 border rounded-lg p-2 min-h-[46px] max-h-40 resize-y"
              placeholder="Scrivi un messaggio (Invio per inviare, Shift+Invio per andare a capo)…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={!selectedId || sending}
            />
            <button
              type="submit"
              disabled={!selectedId || !input.trim() || sending}
              className="whitespace-nowrap bg-black text-white px-4 rounded-lg disabled:opacity-50"
            >
              {sending ? "Invio…" : "Invia"}
            </button>
          </form>
          {err && <p className="mt-2 text-sm text-red-600">{err}</p>}

          {/* Info token */}
          {usage && (
            <p className="mt-2 text-xs text-gray-500">
              Modello: <strong>{usage.model}</strong> — usati{" "}
              <strong>{usage.tokens}</strong> token / limite{" "}
              <strong>{usage.limit}</strong>
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

/* -------------------- Palloncini messaggi -------------------- */
function MessageBubble({ role, content }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2 whitespace-pre-wrap leading-relaxed ${isUser ? "bg-gray-900 text-white" : "bg-gray-100"
          }`}
      >
        {!isUser && <div className="text-xs text-gray-500 mb-1">Get Healthy AI</div>}
        {content}
      </div>
    </div>
  );
}

