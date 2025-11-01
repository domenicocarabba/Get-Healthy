import { NextResponse } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

function sanitizeNext(raw) {
    // evita loop: mai /login, /signup o /auth/callback come destinazione
    const bad = ["/login", "/signup", "/auth/callback"];
    if (!raw || typeof raw !== "string") return "/ai?open=chat";
    const urlOnly = raw.split("#")[0]; // togli hash
    const path = urlOnly.split("?")[0];
    if (bad.includes(path)) return "/ai?open=chat";
    return urlOnly.startsWith("/") ? urlOnly : "/ai?open=chat";
}

export async function middleware(req) {
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req, res });

    const {
        data: { session },
    } = await supabase.auth.getSession();

    const url = req.nextUrl;
    const pathname = url.pathname;
    const search = url.search || "";

    const isProtected = ["/ai", "/account"].some((p) => pathname.startsWith(p));
    const isAuthCallback = pathname.startsWith("/auth/callback");
    const isLoginOrSignup = pathname === "/login" || pathname === "/signup";

    // NON loggato → proteggi le aree riservate
    if (!session && isProtected && !isAuthCallback) {
        const loginUrl = url.clone();
        loginUrl.pathname = "/login";
        // scrivi next una sola volta e "pulito"
        loginUrl.searchParams.set("next", pathname + search);
        return NextResponse.redirect(loginUrl);
    }

    // Già loggato → non restare su /login o /signup
    if (session && isLoginOrSignup) {
        const nextRaw = url.searchParams.get("next") || url.searchParams.get("redirect") || "/ai?open=chat";
        const safe = sanitizeNext(nextRaw);
        // se safe è già /login (non dovrebbe), forziamo /ai
        if (safe === "/login" || safe === "/signup") {
            return NextResponse.redirect(new URL("/ai?open=chat", url.origin));
        }
        if (pathname + search !== safe) {
            return NextResponse.redirect(new URL(safe, url.origin));
        }
    }

    return res;
}

export const config = {
    matcher: ["/ai/:path*", "/account/:path*", "/login", "/signup", "/auth/callback"],
};
