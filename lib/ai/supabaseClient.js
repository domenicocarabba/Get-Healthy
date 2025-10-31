import { createClient } from "@supabase/supabase-js";

let _client;

// funzione unica da usare ovunque
export function supabaseClient() {
    if (_client) return _client;
    _client = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    return _client;
}

// alias per retro-compatibilità (così chi chiama supabaseBrowser() non esplode)
export const supabaseBrowser = supabaseClient;

// opzionale: default export per import di default
export default supabaseClient;
