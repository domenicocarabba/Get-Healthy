import { NextResponse } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req) {
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req, res });

    const { data: { session } } = await supabase.auth.getSession();

    const url = req.nextUrl;
    const path = url.pathname + (url.search || "");

    const isProtected = url.pathname.startsWith("/ai") || url.pathname.startsWith("/account");

    if (!session && isProtected) {
        const to = url.clone();
        to.pathname = "/login";
        to.search = `?next=${encodeURIComponent(path)}`;
        return NextResponse.redirect(to);
    }

    return res;
}

export const config = { matcher: ["/ai/:path*", "/account/:path*"] };
