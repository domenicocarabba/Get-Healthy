"use client";

import { useMemo, useState } from "react";
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

    async function handleLogin(e) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const { error } = await sp.auth.signInWithPassword({
                email: email.trim(),
                password,
            });

            if (error) {
                const msg = (error.message || "").toLowerCase();
                setError(
                    msg.includes("confirm")
                        ? "Devi prima confermare l’email dal link che ti abbiamo inviato."
                        : error.message || "Credenziali non valide."
                );
                return;
            }

            // forza subito i token e VAI
            await sp.auth.refreshSession();
            const dest = nextUrl || "/ai?open=chat";
            try {
                window.location.assign(dest);
            } catch {
                window.location.href = dest;
            }
            setTimeout(() => {
                if (location.pathname === "/login") window.location.href = dest;
            }, 800);
        } catch {
            setError("Errore di rete. Riprova.");
        } finally {
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

                {error && <p className="text-red-600 text-sm">{error}</p>}

                <button
                    type="submit"
                    disabled={loading}
                    className="bg-black text-white rounded p-2 disabled:opacity-60"
                >
                    {loading ? "Accesso..." : "Entra"}
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
