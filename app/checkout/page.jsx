"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter, useSearchParams } from "next/navigation";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function SignUpPage() {
    const router = useRouter();
    const search = useSearchParams();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [err, setErr] = useState("");
    const [ok, setOk] = useState("");

    async function signUp(e) {
        e.preventDefault();
        setErr(""); setOk("");

        const origin =
            typeof window !== "undefined"
                ? window.location.origin
                : process.env.NEXT_PUBLIC_SITE_URL;

        const next = search.get("next") || "/ai";

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`
            },
        });

        if (error) return setErr(error.message);
        setOk("✅ Controlla la tua email per confermare l’account.");
    }

    return (
        <div className="max-w-md mx-auto pt-24 px-6">
            <h1 className="text-2xl font-semibold mb-6">Crea il tuo account</h1>
            <form onSubmit={signUp} className="grid gap-3">
                <input
                    className="border p-2 rounded"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                />
                <input
                    className="border p-2 rounded"
                    placeholder="Password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                />
                <button className="border rounded p-2 hover:bg-gray-100">Registrati</button>
            </form>

            {err && <p className="text-red-600 mt-3">{err}</p>}
            {ok && <p className="text-green-600 mt-3">{ok}</p>}

            <p className="mt-4 text-sm">
                Hai già un account?{" "}
                <a
                    className="underline"
                    href={`/login?next=${encodeURIComponent(search.get("next") || "/ai")}`}
                >
                    Accedi
                </a>
            </p>
        </div>
    );
}
