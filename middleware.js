import { NextResponse } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req) {
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req, res });

    // Aggiorna/crea i cookie della sessione se servono
    const { data: { session } } = await supabase.auth.getSession();

    const url = req.nextUrl;
    const pathname = url.pathname;
    const search = url.search || "";

    const isProtected = ["/ai", "/account"].some((p) => pathname.startsWith(p));
    const isAuthCallback = pathname.startsWith("/auth/callback");
    const isLoginOrSignup = pathname === "/login" || pathname === "/signup";

    // Non loggato → proteggi aree riservate
    if (!session && isProtected && !isAuthCallback) {
        const loginUrl = url.clone();
        loginUrl.pathname = "/login";
        loginUrl.searchParams.set("next", pathname + search);
        loginUrl.searchParams.set("redirect", pathname + search); // compat
        return NextResponse.redirect(loginUrl);
    }

    // Già loggato → non restare su /login o /signup
    if (session && isLoginOrSignup) {
        const next = url.searchParams.get("next") || url.searchParams.get("redirect") || "/ai?open=chat";
        return NextResponse.redirect(new URL(next, url.origin));
    }

    return res;
}

export const config = {
    matcher: ["/ai/:path*", "/account/:path*", "/login", "/signup", "/auth/callback"],
};
