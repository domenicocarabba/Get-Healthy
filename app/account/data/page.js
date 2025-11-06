"use client";

import { useState } from "react";

/** UI atoms */
function Card({ title, subtitle, tone = "neutral", children }) {
    const base =
        "rounded-2xl p-6 border shadow-sm";
    const tones = {
        neutral: "bg-white/3 dark:bg-white/5 border-white/10",
        danger: "bg-red-500/5 border-red-500/30",
    };
    return (
        <section className={`${base} ${tones[tone]}`}>
            <div className="mb-3">
                <h2 className={`text-lg font-semibold ${tone === "danger" ? "text-red-300" : "text-white"}`}>{title}</h2>
                {subtitle && (
                    <p className={`${tone === "danger" ? "text-red-200/90" : "text-white/70"} text-sm mt-1`}>
                        {subtitle}
                    </p>
                )}
            </div>
            {children}
        </section>
    );
}

function Button({ variant = "primary", className = "", ...props }) {
    const base =
        "px-4 py-2 rounded-lg text-sm font-medium transition focus:outline-none focus:ring-2";
    const variants = {
        primary: "bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500/60",
        secondary: "bg-white/10 hover:bg-white/20 text-gray-100 focus:ring-emerald-500/40",
        danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500/60",
    };
    return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

function Kbd({ children }) {
    return <code className="px-1.5 py-0.5 rounded bg-white/10 text-white/90 text-[12px]">{children}</code>;
}

/** Page */
export default function PrivacyDataPage() {
    const [exporting, setExporting] = useState(false);
    const [msg, setMsg] = useState("");
    const [delOpen, setDelOpen] = useState(false);
    const [confirm, setConfirm] = useState("");
    const [deleting, setDeleting] = useState(false);

    async function handleExport() {
        try {
            setMsg(""); setExporting(true);
            // API esistente/da creare: ritorna un JSON con tutti i tuoi dati
            const res = await fetch("/api/account/export");
            if (!res.ok) throw new Error("Errore export");
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = "gethealthy-export.json"; a.click();
            URL.revokeObjectURL(url);
            setMsg("Export completato. File scaricato.");
        } catch (e) {
            setMsg(e.message || "Errore durante l'export");
        } finally {
            setExporting(false);
        }
    }

    async function handleDelete() {
        if (confirm !== "ELIMINA") return;
        try {
            setMsg(""); setDeleting(true);
            const res = await fetch("/api/account/delete", { method: "POST" });
            if (!res.ok) throw new Error("Errore eliminazione");
            setMsg("Account eliminato. Disconnessione in corso…");
            setTimeout(() => (window.location.href = "/"), 1200);
        } catch (e) {
            setMsg(e.message || "Errore eliminazione");
        } finally {
            setDeleting(false);
            setDelOpen(false);
            setConfirm("");
        }
    }

    return (
        <main className="relative min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black text-white">
            <div className="max-w-3xl mx-auto px-6 py-16">
                <h1 className="text-3xl font-bold mb-8">Privacy & Dati</h1>

                <div className="grid gap-6">
                    {/* EXPORT */}
                    <Card
                        title="Scarica i tuoi dati (JSON)"
                        subtitle="Una copia portabile dei dati collegati al tuo account (profilo, dieta, metriche, obiettivi, allergie, allenamenti, ricette salvate)."
                    >
                        <div className="flex flex-wrap items-center gap-3">
                            <Button onClick={handleExport} disabled={exporting}>
                                {exporting ? "Preparazione…" : "Scarica JSON"}
                            </Button>
                            <span className="text-xs text-white/60">
                                Tip: puoi importarlo in qualsiasi tool o inviarcelo per assistenza.
                            </span>
                        </div>
                    </Card>

                    {/* DELETE */}
                    <Card
                        tone="danger"
                        title="Elimina account"
                        subtitle="Azione irreversibile: rimuove account e tutti i dati collegati. Effettua prima l’export se desideri conservarli."
                    >
                        <div className="flex items-center gap-3">
                            <Button variant="danger" onClick={() => setDelOpen(true)}>Elimina definitivamente</Button>
                            <span className="text-xs text-red-200/90">Richiede conferma manuale.</span>
                        </div>
                    </Card>
                </div>

                {msg && <p className="mt-6 text-sm text-white/80">{msg}</p>}
            </div>

            {/* MODALE ELIMINAZIONE */}
            {delOpen && (
                <div className="fixed inset-0 z-50">
                    <div
                        className="absolute inset-0 bg-black/60"
                        onClick={() => !deleting && setDelOpen(false)}
                    />
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-gray-950 p-6 shadow-xl">
                            <h3 className="text-lg font-semibold mb-1">Conferma eliminazione</h3>
                            <p className="text-sm text-white/70 mb-4">
                                Digita <Kbd>ELIMINA</Kbd> per confermare. Questa azione non può essere annullata.
                            </p>
                            <input
                                className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-red-500/60"
                                placeholder="Scrivi ELIMINA"
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                disabled={deleting}
                            />
                            <div className="mt-4 flex justify-end gap-2">
                                <Button
                                    variant="secondary"
                                    onClick={() => setDelOpen(false)}
                                    disabled={deleting}
                                >
                                    Annulla
                                </Button>
                                <Button
                                    variant="danger"
                                    onClick={handleDelete}
                                    disabled={confirm !== "ELIMINA" || deleting}
                                >
                                    {deleting ? "Eliminazione…" : "Elimina"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
