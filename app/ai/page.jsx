"use client";

import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/ai/supabaseClient";

export default function AIPage() {
    const supabase = supabaseClient();
    const [session, setSession] = useState(null);
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        let mounted = true;

        async function load() {
            const { data } = await supabase.auth.getSession();
            console.log("[/ai] getSession", data);
            if (!mounted) return;
            setSession(data.session || null);

            if (data.session) {
                const { user } = data.session;
                // esempio: chiama un endpoint pubblico o RPC se vuoi
                setProfile({ id: user.id, email: user.email });
            }
        }
        load();

        // aggiorna sessione onAuthStateChange
        const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
            console.log("[/ai] onAuthStateChange", _e, s);
            setSession(s);
        });

        return () => {
            mounted = false;
            sub?.subscription?.unsubscribe();
        };
    }, [supabase]);

    if (!session) {
        return (
            <main className="max-w-lg mx-auto pt-24 px-6">
                <h1 className="text-xl font-semibold mb-2">Nessuna sessione</h1>
                <p className="mb-4">Vai al login e riprova.</p>
                <a className="underline" href="/login?redirect=/ai">Login</a>
            </main>
        );
    }

    return (
        <main className="max-w-lg mx-auto pt-24 px-6">
            <h1 className="text-2xl font-semibold mb-2">Sei dentro 🎉</h1>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                {JSON.stringify({ session, profile }, null, 2)}
            </pre>
            <button
                className="mt-4 underline"
                onClick={async () => { await supabase.auth.signOut(); location.href = "/login"; }}
            >
                Esci
            </button>
        </main>
    );
}
