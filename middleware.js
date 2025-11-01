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

    const isProtected = pathname.startsWith("/ai") || pathname.startsWith("/account");

    // Non loggato → manda al login con next, MAI altro.
    if (!session && isProtected) {
        const loginUrl = url.clone();
        loginUrl.pathname = "/login";
        loginUrl.searchParams.set("next", pathname + search);
        return NextResponse.redirect(loginUrl);
    }

    // Altrimenti non fare null'altro.
    return res;
}

export const config = {
    matcher: ["/ai/:path*", "/account/:path*"], // 🔒 SOLO aree private
};
