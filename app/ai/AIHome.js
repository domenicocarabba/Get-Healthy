"use client";

import { useEffect, useState, useRef } from "react";

export default function AIHome() {
  // Threads & selezione
  const [threads, setThreads] = useState([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [selectedId, setSelectedId] = useState(null);

  // Messaggi del thread selezionato
  const [messages, setMessages] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Input & stato invio
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  // Errori globali
  const [err, setErr] = useState("");

  const bottomRef = useRef(null);

  // Auto-scroll in fondo quando cambiano i messaggi
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Carica threads
  useEffect(() => {
    (async () => {
      setErr("");
      setLoadingThreads(true);
      try {
        const res = await fetch("/api/ai/threads", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Errore caricamento chat");
        setThreads(data.threads || []);
        // Se non c'è selection ma esiste un thread, seleziona il primo
        if (!selectedId && (data.threads?.length ?? 0) > 0) {
          handleSelect(data.threads[0].id);
        }
      } catch (e) {
        setErr(e.message || "Errore");
      } finally {
        setLoadingThreads(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSelect(threadId) {
    setSelectedId(threadId);
    setMessages([]);
    setLoadingHistory(true);
    setErr("");
    try {
      const r = await fetch(`/api/ai/history/${threadId}`, { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Errore history");
      setMessages(j.messages || []);
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
      // seleziona subito la nuova chat
      handleSelect(thread.id);
    } catch (e) {
      setErr(e.message || "Errore");
    }
  }

  async function send() {
    if (!selectedId || !input.trim() || sending) return;
    const text = input.trim();

    // UI ottimistica
    const userMsg = {
      id: `temp-user-${Date.now()}`,
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setSending(true);
    setErr("");

    try {
      const r = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId: selectedId, prompt: text }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Errore invio");

      const asstMsg = {
        id: `temp-asst-${Date.now()}`,
        role: "assistant",
        content: j.reply || "",
        created_at: new Date().toISOString(),
      };
      setMessages((m) => [...m, asstMsg]);
    } catch (e) {
      // ripristina input e mostra errore
      setInput(text);
      setErr(e.message || "Errore invio messaggio");
      // ricarica history per sicurezza
      try {
        const r2 = await fetch(`/api/ai/history/${selectedId}`, { cache: "no-store" });
        const j2 = await r2.json();
        if (r2.ok) setMessages(j2.messages || []);
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
      {/* Sidebar threads */}
      <aside className="md:h-[70vh] border rounded-xl p-3 overflow-auto">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Le tue chat</h2>
          <button onClick={newThread} className="bg-black text-white px-3 py-1.5 rounded">
            + Nuova
          </button>
        </div>

        {loadingThreads && <p className="text-sm text-gray-500">Caricamento…</p>}
        {err && <p className="text-sm text-red-600">{err}</p>}
        {!loadingThreads && threads.length === 0 && (
          <p className="text-sm text-gray-600">Nessuna chat. Crea la tua prima conversazione!</p>
        )}

        <ul className="mt-2 space-y-1">
          {threads.map((t) => {
            const active = selectedId === t.id;
            return (
              <li key={t.id}>
                <button
                  onClick={() => handleSelect(t.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg border ${active ? "bg-gray-900 text-white border-gray-900" : "hover:bg-gray-100"
                    }`}
                >
                  {t.title || "Nuova chat"}
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* Chat pane */}
      <section className="md:h-[70vh] border rounded-xl flex flex-col">
        {/* Area messaggi */}
        <div className="flex-1 overflow-auto p-4">
          {!selectedId && (
            <div className="h-full grid place-items-center text-gray-500">
              <p>Seleziona una chat o creane una nuova.</p>
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

        {/* Input box */}
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
        </div>
      </section>
    </div>
  );
}

/* ------------------------- UI: palloncini messaggi ------------------------- */
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
