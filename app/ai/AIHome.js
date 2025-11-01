"use client";

import { useEffect, useState, useRef } from "react";

/**
 * Componente principale per l’interfaccia AI (chat + sidebar)
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

  const bottomRef = useRef(null);

  // scroll automatico
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // carica threads
  useEffect(() => {
    loadThreads();
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
                  className={`w-full text-left px-3 py-2 rounded-lg border transition ${active
                    ? "bg-gray-900 text-white border-gray-900"
                    : "hover:bg-gray-100"
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
        {!isUser && (
          <div className="text-xs text-gray-500 mb-1">Get Healthy AI</div>
        )}
        {content}
      </div>
    </div>
  );
}
