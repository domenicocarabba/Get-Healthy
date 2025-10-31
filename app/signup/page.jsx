"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/ai/supabaseClient"; // <-- importa questa

export default function SignupPage() {
    const router = useRouter();
    const supabase = supabaseClient(); // <-- e usa questa

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(false);

    async function signUp(e) {
        e.preventDefault();
        setErr("");
        setLoading(true);
        const { error } = await supabase.auth.signUp({
            email: email.trim(),
            password,
        });
        setLoading(false);

        if (error) {
            setErr(error.message || "Registrazione non riuscita");
            return;
        }
        router.replace("/ai");
        router.refresh();
    }

    return (
        <div className="max-w-md mx-auto pt-24 px-6">
            <h1 className="text-2xl font-semibold mb-6">Registrati</h1>
            <form onSubmit={signUp} className="grid gap-3">
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
                <button className="bg-black text-white rounded p-2 disabled:opacity-60" disabled={loading}>
                    {loading ? "Creazione account..." : "Crea account"}
                </button>
            </form>
        </div>
    );
}

