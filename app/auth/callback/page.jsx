"use client";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "default-no-store";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { supabaseClient } from "@/lib/ai/supabaseClient";

export default function AuthCallbackPage() {
    const search = useSearchParams();

    useEffect(() => {
        const sp = supabaseClient(); // <-- crea il client SOLO sul client, dentro useEffect

        (async () => {
            const next = search.get("next") || "/ai";

            // 1) Caso HASH: #access_token & #refresh_token
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

            // 2) Caso CODE: ?code=...
            const code = search.get("code");
            if (code) {
                const { error } = await sp.auth.exchangeCodeForSession(code);
                if (!error) {
                    window.location.replace(next);
                    return;
                }
            }

            // 3) Se già loggato comunque, vai a /ai
            try {
                const { data } = await sp.auth.getUser();
                if (data?.user) {
                    window.location.replace(next);
                    return;
                }
            } catch { }

            // 4) Fallback: porta al login con next
            window.location.replace(`/login?next=${encodeURIComponent(next)}`);
        })();
    }, [search]);

    return (
        <div className="max-w-md mx-auto pt-24 px-6">
            <h1 className="text-2xl font-semibold mb-2">Sto completando l’accesso…</h1>
            <p className="text-sm text-gray-700">Un istante, verrai reindirizzato all’app.</p>
        </div>
    );
}
