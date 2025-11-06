"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseClient } from "@/lib/ai/supabaseClient";

export default function SignupPage() {
    const router = useRouter();
    const search = useSearchParams();
    const supabase = supabaseClient();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(false);

    async function onSubmit(e) {
        e.preventDefault();
        setErr("");
        setLoading(true);

        const redirect = decodeURIComponent(search.get("redirect") || "/ai");

        try {
            const { error } = await supabase.auth.signUp({
                email: email.trim(),
                password,
                options: {
                    // assicura che il link nell'email punti al tuo dominio
                    emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "https://gethealthy.it"}/auth/callback`,
                },
            });

            if (error) {
                setErr(error.message || "Registrazione non riuscita");
                return;
            }

            // vai alla pagina “controlla email”
            router.replace(
                `/check-email?email=${encodeURIComponent(email)}&redirect=${encodeURIComponent(redirect)}`
            );
        } catch {
            setErr("Errore di rete, riprova.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-md mx-auto pt-24 px-6">
            <h1 className="text-2xl font-semibold mb-6">Registrati</h1>

            <form onSubmit={onSubmit} className="grid gap-3">
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

                {err && <p className="text-red-600 text-sm">{err}</p>}

                <button
                    type="submit"
                    disabled={loading}
                    className="bg-black text-white rounded p-2 disabled:opacity-60"
                >
                    {loading ? "Creazione account..." : "Crea account"}
                </button>
            </form>

            <p className="mt-4 text-sm">
                Hai già un account? <a className="underline" href="/login">Accedi</a>
            </p>
        </div>
    );
}
