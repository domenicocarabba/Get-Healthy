"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseClient } from "@/lib/ai/supabaseClient";

export default function AuthCallbackPage() {
    const router = useRouter();
    const search = useSearchParams();
    const supabase = supabaseClient();

    useEffect(() => {
        (async () => {
            const next = search.get("next") || "/ai";

            // 1) Caso HASH (#access_token=..., #refresh_token=...)
            const hasHash = typeof window !== "undefined" && window.location.hash?.length > 1;
            if (hasHash) {
                const hash = new URLSearchParams(window.location.hash.slice(1));
                const access_token = hash.get("access_token");
                const refresh_token = hash.get("refresh_token");

                if (access_token && refresh_token) {
                    const { error } = await supabase.auth.setSession({ access_token, refresh_token });
                    if (!error) {
                        window.location.replace(next);
                        return;
                    }
                }
            }

            // 2) Caso CODE (?code=...)
            const code = search.get("code");
            if (code) {
                const { error } = await supabase.auth.exchangeCodeForSession(code);
                if (!error) {
                    window.location.replace(next);
                    return;
                }
            }

            // 3) Ultimo tentativo: se l'utente è già loggato, vai a /ai
            try {
                const { data } = await supabase.auth.getUser();
                if (data?.user) {
                    window.location.replace(next);
                    return;
                }
            } catch { }

            // 4) Se proprio non c'è sessione → vai al login (senza entrare in loop)
            window.location.replace(`/login?next=${encodeURIComponent(next)}`);
        })();
    }, [router, search, supabase]);

    return (
        <div className="max-w-md mx-auto pt-24 px-6">
            <h1 className="text-2xl font-semibold mb-3">Sto completando l’accesso…</h1>
            <p className="text-sm text-gray-700">Un istante, ti reindirizzo all’app.</p>
        </div>
    );
}
