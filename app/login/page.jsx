"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseClient";

export default function LoginPage() {
    const supabase = supabaseBrowser();
    const router = useRouter();
    const search = useSearchParams();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(false);

    async function signIn(e) {
        e.preventDefault();
        setErr("");
        setLoading(true);

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setErr(error.message);
            setLoading(false);
            return;
        }

        // Verifica che la sessione sia salvata
        const { data: sess } = await supabase.auth.getSession();
        console.log("SESSION AFTER LOGIN", sess?.session);

        // Se la sessione esiste, reindirizza
        const next = decodeURIComponent(search.get("next") || "/ai");
        router.push(next);
    }

    return (
        <div className="max-w-md mx-auto pt-24 px-6">
            <h1 className="text-2xl font-semibold mb-6">Accedi</h1>
            <form onSubmit={signIn} className="grid gap-3">
                <input
                    className="border p-2 rounded"
                    placeholder="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    className="border p-2 rounded"
                    placeholder="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-black text-white py-2 rounded hover:bg-gray-800 transition"
                >
                    {loading ? "Accesso in corso..." : "Entra"}
                </button>
                {err && <p className="text-red-600 text-sm">{err}</p>}
            </form>
            <p className="mt-3 text-sm">
                Non hai un account?{" "}
                <a href="/register" className="underline text-blue-600">
                    Registrati
                </a>
            </p>
        </div>
    );
}
