"use client";

import { useEffect, useRef, useState } from "react";

// helpers per file
function readAsDataURL(file) {
    return new Promise((res, rej) => {
        const fr = new FileReader();
        fr.onload = () => res(String(fr.result));
        fr.onerror = rej;
        fr.readAsDataURL(file);
    });
}
function readAsText(file) {
    return new Promise((res, rej) => {
        const fr = new FileReader();
        fr.onload = () => res(String(fr.result));
        fr.onerror = rej;
        fr.readAsText(file);
    });
}

export default function ThreadPage({ params }) {
    const { threadId } = params;

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [usage, setUsage] = useState(null); // { tokens_used_now, token_limit }

    // upload state
    const [imageFiles, setImageFiles] = useState([]);     // File[]
    const [docFiles, setDocFiles] = useState([]);         // File[] (testuali trattati inline)
    const [uploadedFiles, setUploadedFiles] = useState([]); // [{uri,mimeType,name}] (PDF/DOCX via Gemini)
    const imgInputRef = useRef(null);
    const docInputRef = useRef(null);

    const bottomRef = useRef(null);
    const pct = usage && usage.token_limit > 0
        ? Math.min(100, Math.round((usage.tokens_used_now / usage.token_limit) * 100))
        : 0;

    async function loadHistory() {
        setError("");
        try {
            const res = await fetch(`/api/ai/history/${threadId}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || "Errore caricamento storico");
            setMessages(data.messages || []);
        } catch (e) {
            setError(e.message || "Errore");
        }
    }

    useEffect(() => { loadHistory(); }, [threadId]);
    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

    // quando selezioni documenti: testuali -> inline; non-testuali -> upload a Gemini
    async function onPickDocs(e) {
        const all = Array.from(e.target.files || []);
        const textLike = /\.(txt|md|csv|json|log|html|xml)$/i;

        const nextDocFiles = [];
        const nextUploaded = [];

        for (const f of all) {
            if (textLike.test(f.name)) {
                nextDocFiles.push(f);
            } else {
                // carico su endpoint che usa Gemini File API
                const form = new FormData();
                form.append("file", f);
                form.append("name", f.name);

                try {
                    const res = await fetch("/api/ai/upload", { method: "POST", body: form });
                    const data = await res.json();
                    if (res.ok && data.ok) {
                        nextUploaded.push({ uri: data.uri, mimeType: data.mimeType, name: data.name });
                    } else {
                        console.warn("Upload fallito:", f.name, data?.error);
                    }
                } catch (err) {
                    console.warn("Errore upload:", f.name, err);
                }
            }
        }

        setDocFiles(nextDocFiles);
        setUploadedFiles((prev) => [...prev, ...nextUploaded]);
    }

    async function sendMessage(e) {
        e?.preventDefault();
        if (loading) return;
        if (!input.trim() && imageFiles.length === 0 && docFiles.length === 0 && uploadedFiles.length === 0) return;

        setError("");
        setLoading(true);

        // anteprima utente
        setMessages((prev) => [
            ...prev,
            {
                id: `u-${Date.now()}`,
                role: "user",
                content:
                    input ||
                    (imageFiles.length ? `🖼️ ${imageFiles.length} immagine/i` : "") ||
                    (docFiles.length ? `📎 ${docFiles.length} file testuali` : "") ||
                    (uploadedFiles.length ? `☁️ ${uploadedFiles.length} file caricati su Gemini` : ""),
            },
        ]);

        try {
            // immagini -> dataURL
            const images = [];
            for (const f of imageFiles.slice(0, 4)) images.push(await readAsDataURL(f));

            // docs testuali -> testo
            const docs = [];
            for (const f of docFiles.slice(0, 5)) {
                const text = await readAsText(f);
                docs.push({ name: f.name, text });
            }

            // file già caricati su Gemini
            const fileUris = uploadedFiles;

            const res = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    threadId,
                    userMessage: input || "Analizza gli allegati.",
                    images,
                    docs,
                    fileUris,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || "Errore invio messaggio");

            setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: "assistant", content: data.reply }]);
            setUsage({ tokens_used_now: data.tokens_used_now, token_limit: data.token_limit });
        } catch (e) {
            setError(e.message || "Errore");
        } finally {
            setLoading(false);
            setInput("");
            setImageFiles([]);
            setDocFiles([]);
            setUploadedFiles([]);
            if (imgInputRef.current) imgInputRef.current.value = "";
            if (docInputRef.current) docInputRef.current.value = "";
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }

    return (
        <div className="max-w-3xl mx-auto px-6 pt-24">
            <div className="flex items-center justify-between mb-3">
                <a href="/ai" className="text-sm underline">← Tutte le chat</a>
                {usage && (
                    <div className="w-56">
                        <div className="flex items-center justify-between text-[11px] text-gray-600 mb-1">
                            <span>Token</span>
                            <span>{usage.tokens_used_now} / {usage.token_limit} ({pct}%)</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-2 bg-green-600" style={{ width: `${pct}%` }} />
                        </div>
                    </div>
                )}
            </div>

            {error && <div className="text-sm text-red-600 mb-3">{error}</div>}

            <div className="border rounded p-4 space-y-3 min-h-[40vh] bg-white">
                {messages.map((m, i) => (
                    <div key={m.id || i} className={m.role === "user" ? "text-right" : "text-left"}>
                        <div className={`inline-block rounded px-3 py-2 whitespace-pre-wrap ${m.role === "user" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-900"}`}>
                            {m.content}
                        </div>
                    </div>
                ))}
                <div ref={bottomRef} />
                {loading && <div className="text-sm text-gray-500">Sto pensando…</div>}
            </div>

            <form onSubmit={sendMessage} className="mt-4 space-y-3">
                <textarea
                    className="w-full border rounded px-3 py-2"
                    rows={2}
                    placeholder="Scrivi qui… (puoi allegare foto e file)"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                />

                {/* Foto: su mobile apre anche la fotocamera */}
                <div className="flex items-center gap-3">
                    <label className="text-sm">Foto:</label>
                    <input
                        ref={imgInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        capture="environment"
                        onChange={(e) => setImageFiles(Array.from(e.target.files || []))}
                    />
                </div>
                {imageFiles.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                        {imageFiles.map((f, i) => (
                            <img key={i} src={URL.createObjectURL(f)} alt={`img-${i}`} className="w-16 h-16 object-cover rounded border" />
                        ))}
                    </div>
                )}

                {/* Documenti: testuali inline, PDF/DOCX caricati su Gemini */}
                <div className="flex items-center gap-3">
                    <label className="text-sm">File:</label>
                    <input
                        ref={docInputRef}
                        type="file"
                        multiple
                        accept=".txt,.md,.csv,.json,.log,.html,.xml,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={onPickDocs}
                    />
                </div>
                {(uploadedFiles.length > 0 || docFiles.length > 0) && (
                    <div className="text-xs text-gray-600">
                        {uploadedFiles.map((f, i) => <div key={`u-${i}`}>☁️ {f.name}</div>)}
                        {docFiles.map((f, i) => <div key={`d-${i}`}>📎 {f.name}</div>)}
                    </div>
                )}

                <div className="flex justify-end">
                    <button className="bg-black text-white rounded px-4 py-2" disabled={loading}>
                        {loading ? "..." : "Invia"}
                    </button>
                </div>
            </form>
        </div>
    );
}

