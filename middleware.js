import { NextResponse } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req) {
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req, res });

    // Aggiorna/crea i cookie di sessione se servono
    const { data: { session } } = await supabase.auth.getSession();

    const url = req.nextUrl;
    const pathname = url.pathname;
    const search = url.search || "";

    // Pagine/aree da proteggere
    const protectedRoots = ["/ai", "/account"];
    const isProtected = protectedRoots.some((p) => pathname.startsWith(p));

    // Evita di toccare la callback di Supabase
    const isAuthCallback = pathname.startsWith("/auth/callback");

    // Se NON loggato e tenta di accedere a rotta protetta → login con next & redirect
    if (!session && isProtected && !isAuthCallback) {
        const loginUrl = url.clone();
        loginUrl.pathname = "/login";
        loginUrl.searchParams.set("next", pathname + search);     // standard
        loginUrl.searchParams.set("redirect", pathname + search); // compat con vecchio codice
        return NextResponse.redirect(loginUrl);
    }

    // Se loggato e va su /login o /signup → mandalo dove serve (next o /ai?open=chat)
    const isLoginOrSignup = pathname === "/login" || pathname === "/signup";
    if (session && isLoginOrSignup) {
        const next = url.searchParams.get("next") || url.searchParams.get("redirect") || "/ai?open=chat";
        const dest = url.clone();
        dest.pathname = next.startsWith("/") ? next.split("?")[0] : "/ai";
        const qs = next.includes("?") ? next.slice(next.indexOf("?")) : "";
        return NextResponse.redirect(new URL(dest.pathname + qs, url.origin));
    }

    return res;
}

// Intercetta SOLO ciò che serve (performance & niente loop)
export const config = {
    matcher: [
        "/ai/:path*",
        "/account/:path*",
        "/login",
        "/signup",
        "/auth/callback",
    ],
};
