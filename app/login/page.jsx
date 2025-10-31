"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseClient } from "@/lib/ai/supabaseClient";

export default function LoginPage() {
    const router = useRouter();
    const search = useSearchParams();
    const supabase = supabaseClient();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(false);

    async function signIn(e) {
        e.preventDefault();
        setErr("");
        setLoading(true);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
            });

            if (error) {
                setErr(error.message || "Credenziali non valide");
                return;
            }

            // redirect: usa ?redirect=/ai se presente, altrimenti /ai
            const redirect = search.get("redirect") || "/ai";
            router.replace(redirect);
            router.refresh(); // rende visibile la sessione a Server Components/API
        } catch (e) {
            setErr("Errore di rete. Riprova.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-md mx-auto pt-24 px-6">
            <h1 className="text-2xl font-semibold mb-6">Accedi</h1>

            <form onSubmit={signIn} className="grid gap-3">
                <input
                    type="email"
                    autoComplete="email"
                    className="border p-2 rounded"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    autoComplete="current-password"
                    className="border p-2 rounded"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                {err && <p className="text-red-600 text-sm">{err}</p>}

                <button
                    className="bg-black text-white rounded p-2 disabled:opacity-60"
                    disabled={loading}
                    type="submit"
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

