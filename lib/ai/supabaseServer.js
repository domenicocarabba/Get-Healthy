import { cookies } from "next/headers";
import { createServerComponentClient, createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client per Server Components (pagine dentro /app)
 */
export function supabaseServer() {
    return createServerComponentClient({ cookies });
}

/**
 * Supabase client per Route Handlers (/app/api/.../route.js)
 */
export function supabaseRoute() {
    return createRouteHandlerClient({ cookies });
}

/**
 * Supabase ADMIN client (usa la Service Role Key) — solo lato server
 * ⚠️ Richiede la variabile SUPABASE_SERVICE_ROLE_KEY su Vercel/local
 */
export function supabaseAdmin() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // non pubblica

    if (!url || !serviceKey) {
        throw new Error("Missing env vars: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }

    return createClient(url, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
}

