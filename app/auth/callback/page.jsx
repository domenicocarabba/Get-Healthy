"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseClient } from "@/lib/ai/supabaseClient";

export default function AuthCallbackPage() {
    const router = useRouter();
    const search = useSearchParams();
    const supabase = supabaseClient();

    useEffect(() => {
        async function run() {
            const next = search.get("next") || "/ai";

            // 🔹 1) Caso hash: #access_token=...
            if (typeof window !== "undefined" && window.location.hash) {
                const hash = new URLSearchParams(window.location.hash.slice(1));
                const access_token = hash.get("access_token");
                const refresh_token = hash.get("refresh_token");

                if (access_token && refresh_token) {
                    const { error } = await supabase.auth.setSession({ access_token, refresh_token });
                    if (!error) {
                        router.replace(next);
                        router.refresh();
                        return;
                    }
                }
            }

            // 🔹 2) Caso code: ?code=...
            const code = search.get("code");
            if (code) {
                const { error } = await supabase.auth.exchangeCodeForSession(code);
                if (!error) {
                    router.replace(next);
                    router.refresh();
                    return;
                }
            }

            // 🔹 Se nessun caso funziona → torna al login
            router.replace(`/login?next=${encodeURIComponent(next)}`);
        }

        run();
    }, [router, search, supabase]);

    return (
        <div className="max-w-md mx-auto pt-24 px-6">
            <h1 className="text-2xl font-semibold mb-3">Sto completando l’accesso…</h1>
            <p className="text-sm text-gray-700">Attendi un istante.</p>
        </div>
    );
}
