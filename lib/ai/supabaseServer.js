import { cookies } from "next/headers";
import { createServerClient, createClient } from "@supabase/ssr";

/**
 * ✅ Client server-side per le pagine Next.js (Server Components)
 */
export function supabaseServer() {
    const cookieStore = cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                get: (name) => cookieStore.get(name)?.value,
                set: (name, value, options) => cookieStore.set({ name, value, ...options }),
                remove: (name, options) =>
                    cookieStore.set({ name, value: "", ...options, expires: new Date(0) }),
            },
        }
    );
}

/**
 * ✅ Client per le API Route (usa stesso wiring dei cookie)
 */
export function supabaseRoute() {
    const cookieStore = cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                get: (name) => cookieStore.get(name)?.value,
                set: (name, value, options) => cookieStore.set({ name, value, ...options }),
                remove: (name, options) =>
                    cookieStore.set({ name, value: "", ...options, expires: new Date(0) }),
            },
        }
    );
}

/**
 * ✅ Client admin per chiamate lato server senza sessione utente
 * (richiede la service role key → NON esportare mai lato client!)
 */
export function supabaseAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
            auth: { persistSession: false },
        }
    );
}
