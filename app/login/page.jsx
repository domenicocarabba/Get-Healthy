"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { supabaseClient } from "@/lib/ai/supabaseClient";

function safeNext(raw) {
    const bad = ["/login", "/signup", "/auth/callback"];
    try {
        const n = raw || "/ai?open=chat";
        const clean = n.split("#")[0];
        const path = clean.split("?")[0];
        if (bad.includes(path)) return "/ai?open=chat";
        return clean.startsWith("/") ? clean : "/ai?open=chat";
    } catch {
        return "/ai?open=chat";
    }
}

export default function LoginPage() {
    const search = useSearchParams();
    const sp = supabaseClient();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const nextUrl = useMemo(() => {
        const n = search.get("next");
        const r = search.get("redirect");
        return safeNext(decodeURIComponent(n || r || "/ai?open=chat"));
    }, [search]);

    // Se arrivi già autenticato, vai via subito
    useEffect(() => {
        (async () => {
            try {
                const { data } = await sp.auth.getUser();
                if (data?.user) {
                    window.location.replace(nextUrl);
                }
            } catch {/* ignore */ }
        })();
    }, [sp, nextUrl]);

    async function waitForSessionAndGo(dest) {
        // prova per ~5 secondi a vedere la sessione
        for (let i = 0; i < 16; i++) {
            try {
                const [{ data: s }, { data: u }] = await Promise.all([
                    sp.auth.getSession(),
                    sp.auth.getUser(),
                ]);
                if (s?.session || u?.user) {
                    window.location.assign(dest);
                    return;
                }
            } catch {/* ignore */ }
            await new Promise(r => setTimeout(r, 300));
        }
        // se ancora niente, prova comunque ad andare (il middleware protegge /ai)
        window.location.assign(dest);
    }

    async function handleLogin(e) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            // login
            const { error: signErr } = await sp.auth.signInWithPassword({
                email: email.trim(),
                password,
            });

            if (signErr) {
                const msg = (signErr.message || "").toLowerCase();
                setError(
                    msg.includes("confirm")
                        ? "Devi prima confermare l’email dal link che ti abbiamo inviato."
                        : signErr.message || "Credenziali non valide."
                );
                setLoading(false);
                return;
            }

            // forza il refresh dei token
            const { error: refErr } = await sp.auth.refreshSession();
            if (refErr) {
                console.warn("[LOGIN] refreshSession error:", refErr);
            }

            const dest = nextUrl || "/ai?open=chat";

            // fallback di sicurezza: se per qualsiasi motivo il browser non cambia pagina
            setTimeout(() => {
                if (location.pathname === "/login") {
                    window.location.href = dest;
                }
            }, 1500);

            // attiva polling della sessione e poi vai
            await waitForSessionAndGo(dest);
        } catch (err) {
            console.error("[LOGIN] exception", err);
            setError("Errore di rete. Riprova.");
            setLoading(false);
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
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                />

                {error && (
                    <p className="text-red-600 text-sm whitespace-pre-wrap">{error}</p>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="bg-black text-white rounded p-2 disabled:opacity-60"
                >
                    {loading ? "Accesso in corso..." : "Entra"}
                </button>
            </form>

            <p className="mt-4 text-sm">
                Non hai un account?{" "}
                <a className="underline" href={`/signup?next=${encodeURIComponent(nextUrl)}`}>
                    Registrati
                </a>
            </p>
        </div>
    );
}
