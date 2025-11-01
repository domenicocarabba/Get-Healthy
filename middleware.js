import { NextResponse } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req) {
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req, res });

    const {
        data: { session },
    } = await supabase.auth.getSession();

    const url = req.nextUrl;
    const pathname = url.pathname;
    const search = url.search || "";

    const isProtected = ["/ai"].some((p) => pathname.startsWith(p));
    const isAuthCallback = pathname.startsWith("/auth/callback");
    const isLoginOrSignup = pathname === "/login" || pathname === "/signup";

    if (!session && isProtected && !isAuthCallback) {
        const loginUrl = url.clone();
        loginUrl.pathname = "/login";
        loginUrl.searchParams.set("next", pathname + search);
        return NextResponse.redirect(loginUrl);
    }

    if (session && isLoginOrSignup) {
        const next = url.searchParams.get("next") || "/ai";
        return NextResponse.redirect(new URL(next, url.origin));
    }

    return res;
}

export const config = {
    matcher: ["/ai/:path*", "/login", "/signup", "/auth/callback"],
};
