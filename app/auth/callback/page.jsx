"use client";
export const dynamic = "force-dynamic";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { supabaseClient } from "@/lib/ai/supabaseClient";

export default function AuthCallbackPage() {
    const search = useSearchParams();

    useEffect(() => {
        const sp = supabaseClient();

        (async () => {
            const next = search.get("next") || "/ai";

            // #access_token / #refresh_token
            if (typeof window !== "undefined" && window.location.hash?.length > 1) {
                const hash = new URLSearchParams(window.location.hash.slice(1));
                const access_token = hash.get("access_token");
                const refresh_token = hash.get("refresh_token");
                if (access_token && refresh_token) {
                    const { error } = await sp.auth.setSession({ access_token, refresh_token });
                    if (!error) { window.location.replace(next); return; }
                }
            }

            // ?code=...
            const code = search.get("code");
            if (code) {
                const { error } = await sp.auth.exchangeCodeForSession(code);
                if (!error) { window.location.replace(next); return; }
            }

            // Già loggato?
            const { data } = await sp.auth.getUser();
            if (data?.user) { window.location.replace(next); return; }

            // fallback
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
