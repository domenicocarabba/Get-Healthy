"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabaseClient } from "@/lib/ai/supabaseClient";

function safeNext(raw) {
    try {
        const n = raw || "/ai?open=chat";
        const clean = n.split("#")[0];
        const p = clean.split("?")[0];
        if (["/login", "/signup", "/auth/callback"].includes(p)) return "/ai?open=chat";
        return clean.startsWith("/") ? clean : "/ai?open=chat";
    } catch { return "/ai?open=chat"; }
}

export default function LoginPage() {
    const search = useSearchParams();
    const sp = supabaseClient();

    const [email, setEmail] = useState("");
    const [password, setPwd] = useState("");
    const [err, setErr] = useState("");
    const [loading, setLoad] = useState(false);

    const nextUrl = useMemo(() => {
        const n = search.get("next");
        const r = search.get("redirect");
        return safeNext(decodeURIComponent(n || r || "/ai?open=chat"));
    }, [search]);

    async function handleLogin(e) {
        e.preventDefault();
        setErr(""); setLoad(true);
        try {
            const { error } = await sp.auth.signInWithPassword({ email: email.trim(), password });
            if (error) {
                const m = (error.message || "").toLowerCase();
                setErr(m.includes("confirm") ? "Conferma prima l’email dal link che ti abbiamo inviato." : error.message || "Credenziali non valide.");
                setLoad(false);
                return;
            }
            await sp.auth.refreshSession();

            // HARD redirect (busta cache con ts per evitare ri-uso pagina /login)
            const dest = `${nextUrl}${nextUrl.includes("?") ? "&" : "?"}ts=${Date.now()}`;
            window.location.href = dest;

            // safety net
            setTimeout(() => { if (location.pathname === "/login") window.location.replace(dest); }, 800);
        } catch {
            setErr("Errore di rete. Riprova.");
            setLoad(false);
        }
    }

    return (
        <div className="max-w-md mx-auto pt-24 px-6">
            <h1 className="text-2xl font-semibold mb-6">Accedi</h1>
            <form onSubmit={handleLogin} className="grid gap-3">
                <input type="email" className="border p-2 rounded" placeholder="Email"
                    value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
                <input type="password" className="border p-2 rounded" placeholder="Password"
                    value={password} onChange={(e) => setPwd(e.target.value)} required autoComplete="current-password" />
                {err && <p className="text-red-600 text-sm whitespace-pre-wrap">{err}</p>}
                <button type="submit" disabled={loading} className="bg-black text-white rounded p-2 disabled:opacity-60">
                    {loading ? "Accesso in corso..." : "Entra"}
                </button>
            </form>
            <p className="mt-4 text-sm">
                Non hai un account? <a className="underline" href={`/signup?next=${encodeURIComponent(nextUrl)}`}>Registrati</a>
            </p>
        </div>
    );
}
