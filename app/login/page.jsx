"use client";

import { useState, useEffect } from "react";
import { supabaseClient } from "@/lib/ai/supabaseClient";

export default function LoginPage() {
    const supabase = supabaseClient();

    const [email, setEmail] = useState("");
    const [password, setPwd] = useState("");
    const [err, setErr] = useState("");
    const [loading, setLoad] = useState(false);

    // se arrivi già autenticato (es. dopo conferma email) → vai subito in /ai
    useEffect(() => {
        (async () => {
            try {
                const { data } = await supabase.auth.getUser();
                if (data?.user) {
                    window.location.replace("/ai?open=chat");
                }
            } catch { }
        })();
    }, [supabase]);

    async function handleLogin(e) {
        e.preventDefault();
        setErr("");
        setLoad(true);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
            });

            if (error) {
                const m = (error.message || "").toLowerCase();
                setErr(
                    m.includes("confirm")
                        ? "Devi prima confermare l’email dal link che ti abbiamo inviato."
                        : error.message || "Credenziali non valide."
                );
                setLoad(false);
                return;
            }

            // assicura che i token/cookie siano aggiornati
            await supabase.auth.refreshSession();

            // HARD redirect diretto all’AI (l’AI page ha il guard client-side)
            const dest = "/ai?open=chat";
            try {
                window.location.assign(dest);
            } catch {
                window.location.href = dest;
            }
            // safety net se il browser non navigasse
            setTimeout(() => {
                if (location.pathname === "/login") window.location.replace(dest);
            }, 800);
        } catch {
            setErr("Errore di rete. Riprova.");
            setLoad(false);
        }
    }

    return (
        <div className="max-w-md mx-auto pt-24 px-6">
            <h1 className="text-2xl font-semibold mb-6">Accedi</h1>

            <form onSubmit={handleLogin} className="grid gap-3">
                <input
                    type="email"
                    className="border p-2 rounded"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                />
                <input
                    type="password"
                    className="border p-2 rounded"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPwd(e.target.value)}
                    required
                    autoComplete="current-password"
                />

                {err && <p className="text-red-600 text-sm whitespace-pre-wrap">{err}</p>}

                <button
                    type="submit"
                    disabled={loading}
                    className="bg-black text-white rounded p-2 disabled:opacity-60"
                >
                    {loading ? "Accesso in corso..." : "Entra"}
                </button>
            </form>

            <p className="mt-4 text-sm">
                Non hai un account? <a className="underline" href="/signup">Registrati</a>
            </p>
        </div>
    );
}
