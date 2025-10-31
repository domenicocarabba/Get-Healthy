"use client";
import { useEffect, useState } from "react";

export default function AIHome() {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/ai/threads");
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Errore");
        setThreads(data.threads || []);
      } catch (e) {
        setErr(e.message || "Errore");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function newThread() {
    setErr("");
    try {
      const res = await fetch("/api/ai/thread", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Errore creazione chat");
      // ricarica lista
      setThreads((t) => [data.thread, ...t]);
    } catch (e) {
      setErr(e.message || "Errore");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Le tue chat</h2>
        <button onClick={newThread} className="bg-black text-white px-3 py-2 rounded">
          Nuova chat
        </button>
      </div>
      {loading && <p>Caricamento…</p>}
      {err && <p className="text-red-600">{err}</p>}
      {!loading && !threads.length && <p>Nessuna chat ancora. Crea la tua prima conversazione!</p>}
      <ul className="divide-y">
        {threads.map((t) => (
          <li key={t.id} className="py-2">{t.title || `Thread ${t.id}`}</li>
        ))}
      </ul>
    </div>
  );
}
