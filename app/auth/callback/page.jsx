"use client";
export const dynamic = "force-dynamic";

import { useEffect } from "react";
import { supabaseClient } from "@/lib/ai/supabaseClient";

export default function AuthCallbackPage() {
    useEffect(() => {
        const sp = supabaseClient();

        (async () => {
            const DEST = "/ai?open=chat";

            // 1) Caso hash: #access_token / #refresh_token
            if (typeof window !== "undefined" && window.location.hash?.length > 1) {
                const hash = new URLSearchParams(window.location.hash.slice(1));
                const access_token = hash.get("access_token");
                const refresh_token = hash.get("refresh_token");
                if (access_token && refresh_token) {
                    const { error } = await sp.auth.setSession({ access_token, refresh_token });
                    if (!error) {
                        window.location.replace(DEST);
                        return;
                    }
                }
            }

            // 2) Caso code: ?code=...
            const url = new URL(window.location.href);
            const code = url.searchParams.get("code");
            if (code) {
                const { error } = await sp.auth.exchangeCodeForSession(code);
                if (!error) {
                    window.location.replace(DEST);
                    return;
                }
            }

            // 3) Già loggato? Vai comunque all'AI
            try {
                const { data } = await sp.auth.getUser();
                if (data?.user) {
                    window.location.replace(DEST);
                    return;
                }
            } catch { }

            // 4) Fallback: torna al login (senza next strani)
            window.location.replace("/login");
        })();
    }, []);

    return (
        <div className="max-w-md mx-auto pt-24 px-6">
            <h1 className="text-2xl font-semibold mb-2">Sto completando l’accesso…</h1>
            <p className="text-sm text-gray-700">Un istante, verrai reindirizzato all’app.</p>
        </div>
    );
}
