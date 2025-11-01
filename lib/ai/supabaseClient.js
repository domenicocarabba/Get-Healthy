"use client";

import { createBrowserClient } from "@supabase/ssr";

let _client;

/** Client Supabase per componenti client (con cookie compatibili col middleware) */
export function supabaseClient() {
    if (_client) return _client;

    _client = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true, // importante per i link email (#access_token o ?code)
            },
        }
    );

    return _client;
}
