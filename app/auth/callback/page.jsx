"use client";

import { useEffect } from "react";
import { supabaseClient } from "@/lib/ai/supabaseClient";
import { useSearchParams } from "next/navigation";

export default function AuthCallbackPage() {
    const sp = supabaseClient();
    const search = useSearchParams();

    useEffect(() => {
        (async () => {
            const next = search.get("next") || "/ai";

            // 1) #access_token / #refresh_token
            if (typeof window !== "undefined" && window.location.hash?.length > 1) {
                const hash = new URLSearchParams(window.location.hash.slice(1));
                const access_token = hash.get("access_token");
                const refresh_token = hash.get("refresh_token");
                if (access_token && refresh_token) {
                    const { error } = await sp.auth.setSession({ access_token, refresh_token });
                    if (!error) {
                        window.location.replace(next);
                        return;
                    }
                }
            }

            // 2) ?code=...
            const code = search.get("code");
            if (code) {
                const { error } = await sp.auth.exchangeCodeForSession(code);
                if (!error) {
                    window.location.replace(next);
                    return;
                }
            }

            // 3) Se già loggato, vai a /ai
            try {
                const { data } = await sp.auth.getUser();
                if (data?.user) {
                    window.location.replace(next);
                    return;
                }
            } catch { }

            // 4) Fallback: se proprio non c'è sessione, mostra un messaggio
            // (niente redirect a /login per evitare loop in questa fase)
            alert("Non riesco a completare l’accesso dal link. Prova ad accedere manualmente.");
            window.location.replace("/login?next=/ai");
        })();
    }, [sp, search]);

    return (
        <div className="max-w-md mx-auto pt-24 px-6">
            <h1 className="text-2xl font-semibold mb-2">Sto completando l’accesso…</h1>
            <p className="text-sm text-gray-700">Un istante, verrai reindirizzato all’app.</p>
        </div>
    );
}
