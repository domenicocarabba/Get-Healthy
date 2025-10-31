// /lib/ai/supabaseClient.js
"use client";
import { createBrowserClient } from "@supabase/ssr";

let _client;
export function supabaseClient() {
    if (_client) return _client;
    _client = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                // fallback su localStorage; in browser va bene così
            },
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
                flowType: "pkce",
            },
        }
    );
    return _client;
}
