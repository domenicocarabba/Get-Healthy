"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabaseClient } from "@/lib/ai/supabaseClient";

export default function CheckEmailPage() {
    const search = useSearchParams();
    const supabase = supabaseClient();

    const initialEmail = useMemo(() => search.get("email") || "", [search]);

    const [email, setEmail] = useState(initialEmail);
    const [msg, setMsg] = useState("");
    const [err, setErr] = useState("");
    const [sending, setSending] = useState(false);

    async function resend(e) {
        if (e) e.preventDefault();
        setMsg("");
        setErr("");

        if (!email) {
            setErr("Inserisci un'email valida.");
            return;
        }

        setSending(true);
        try {
            const origin =
                typeof window !== "undefined"
                    ? window.location.origin
                    : process.env.NEXT_PUBLIC_SITE_URL || "https://gethealthy.it";

            const { error } = await supabase.auth.resend({
                type: "signup",
                email: email.trim(),
                options: {
                    // Dopo il click nel link email → callback che crea la sessione → redirect in /ai
                    emailRedirectTo: `${origin}/auth/callback?next=/ai`,
                },
            });

            if (error) {
                setErr(error.message || "Impossibile inviare di nuovo l'email.");
            } else {
                setMsg("Email inviata di nuovo. Controlla la casella (anche Spam).");
            }
        } catch {
            setErr("Errore di rete, riprova.");
        } finally {
            setSending(false);
        }
    }

    return (
        <div className="max-w-md mx-auto pt-24 px-6 text-center">
            <h1 className="text-2xl font-semibold mb-3">Controlla la tua email</h1>
            <p className="text-sm text-gray-700">
                Ti abbiamo inviato un messaggio a{" "}
                <strong>{email || "la tua email"}</strong>.<br />
                Clicca sul link di conferma nell’email. Dopo la conferma verrai
                reindirizzato automaticamente all’app.
            </p>

            <form onSubmit={resend} className="mt-6 grid gap-3">
                {!initialEmail && (
                    <input
                        type="email"
                        className="border p-2 rounded"
                        placeholder="Inserisci la tua email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                )}

                <button
                    disabled={sending || !email}
                    className="bg-black text-white rounded p-2 disabled:opacity-60"
                >
                    {sending ? "Invio..." : "Invia di nuovo l’email"}
                </button>

                {msg && <p className="text-green-700 text-sm">{msg}</p>}
                {err && <p className="text-red-600 text-sm">{err}</p>}
            </form>
        </div>
    );
}
