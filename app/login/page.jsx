"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseClient } from "@/lib/ai/supabaseClient";

export default function LoginPage() {
    const router = useRouter();
    const search = useSearchParams();
    const supabase = supabaseClient();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const redirect = useMemo(
        () => decodeURIComponent(search.get("redirect") || "/ai"),
        [search]
    );

    async function handleLogin(e) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            console.log("[LOGIN] start", { email, redirect });

            const { data, error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
            });

            console.log("[LOGIN] signIn result", { data, error });

            if (error) {
                const msg = error.message?.toLowerCase() || "";
                if (msg.includes("confirm")) {
                    setError("Devi prima confermare l’email dal link che ti abbiamo inviato.");
                } else {
                    setError(error.message || "Credenziali non valide.");
                }
                return;
            }

            // Controllo sessione subito dopo
            const { data: sess } = await supabase.auth.getSession();
            console.log("[LOGIN] getSession after signIn", sess);

            if (!sess?.session) {
                setError(
                    "Accesso non riuscito (nessuna sessione). Verifica che l’email sia confermata."
                );
                return;
            }

            // Redirect sicuro
            router.replace(redirect || "/ai");
            router.refresh();
            console.log("[LOGIN] redirect→", redirect || "/ai");
        } catch (err) {
            console.error("[LOGIN] exception", err);
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
                Non hai un account? <a className="underline" href="/signup">Registrati</a>
            </p>
        </div>
    );
}
