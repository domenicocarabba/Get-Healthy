// /lib/ai/supabaseServer.js
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js"; // <-- admin da supabase-js

/**
 * Client server-side per pagine e API: usa ANON + cookie utente
 * (stesso progetto del client)
 */
export function supabaseServer() {
    const store = cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,        // = stesso URL del progetto
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,   // ANON key
        {
            cookies: {
                get: (name) => store.get(name)?.value,
                set: (name, value, options) => store.set({ name, value, ...options }),
                remove: (name, options) => store.set({ name, value: "", ...options, expires: new Date(0) }),
            },
        }
    );
}

/**
 * Alias per le API Routes (stessa cosa del sopra)
 */
export const supabaseRoute = supabaseServer;

/**
 * Client admin per job/server che devono bypassare RLS.
 * Usa SERVICE ROLE e l'URL server-side, NON esporla mai al client.
 */
let _admin;
export function supabaseAdmin() {
    if (_admin) return _admin;
    _admin = createClient(
        process.env.SUPABASE_URL,                 // <-- usa SUPABASE_URL (stesso valore del NEXT_PUBLIC)
        process.env.SUPABASE_SERVICE_ROLE_KEY,    // <-- service role
        { auth: { persistSession: false } }
    );
    return _admin;
}
