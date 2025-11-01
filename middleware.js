import { NextResponse } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

function sanitizeNext(raw) {
    const bad = ["/login", "/signup", "/auth/callback"];
    if (!raw || typeof raw !== "string") return "/ai?open=chat";
    const urlOnly = raw.split("#")[0];
    const path = urlOnly.split("?")[0];
    if (bad.includes(path)) return "/ai?open=chat";
    return urlOnly.startsWith("/") ? urlOnly : "/ai?open=chat";
}

export async function middleware(req) {
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req, res });

    const { data: { session } } = await supabase.auth.getSession();

    const url = req.nextUrl;
    const pathname = url.pathname;
    const search = url.search || "";

    const isProtected = ["/ai", "/account"].some((p) => pathname.startsWith(p));
    const isLoginOrSignup = pathname === "/login" || pathname === "/signup";

    // Non loggato → proteggi aree riservate
    if (!session && isProtected) {
        const loginUrl = url.clone();
        loginUrl.pathname = "/login";
        loginUrl.searchParams.set("next", pathname + search);
        return NextResponse.redirect(loginUrl);
    }

    // Già loggato → non restare su /login o /signup
    if (session && isLoginOrSignup) {
        const nextRaw = url.searchParams.get("next") || url.searchParams.get("redirect") || "/ai?open=chat";
        const safe = sanitizeNext(nextRaw);
        return NextResponse.redirect(new URL(safe, url.origin));
    }

    return res;
}

export const config = {
    matcher: ["/ai/:path*", "/account/:path*", "/login", "/signup"],
};
