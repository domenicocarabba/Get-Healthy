"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabaseClient } from "@/lib/ai/supabaseClient";

export default function LoginPage() {
    const search = useSearchParams();
    const supabase = supabaseClient();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const nextUrl = useMemo(() => {
        const n = search.get("next");
        const r = search.get("redirect");
        return decodeURIComponent(n || r || "/ai");
    }, [search]);

    // Se sei già loggato (magari dopo conferma email) → vai direttamente in /ai
    useEffect(() => {
        (async () => {
            const { data } = await supabase.auth.getUser();
            if (data?.user) {
                window.location.replace(nextUrl);
            }
        })();
    }, [supabase, nextUrl]);

    async function handleLogin(e) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
            });

            if (error) {
                if (error.message.toLowerCase().includes("confirm")) {
                    setError("Devi prima confermare l’email dal link che ti abbiamo inviato.");
                } else {
                    setError(error.message);
                }
                return;
            }

            // forza la creazione cookie/sessione
            await supabase.auth.refreshSession();

            // redirect reale, così middleware riceve i cookie
            window.location.assign(nextUrl);
        } catch (err) {
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
                />
                <input
                    type="password"
                    className="border p-2 rounded"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
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
