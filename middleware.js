import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req) {
    const res = NextResponse.next();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                get: (key) => req.cookies.get(key)?.value,
            },
        }
    );

    const { data } = await supabase.auth.getSession();
    const session = data?.session;

    const path = req.nextUrl.pathname;
    const isAuthPage = path.startsWith("/login");
    const wantsAI = path.startsWith("/ai");

    // Se non loggato e prova ad accedere a /ai → redirect al login
    if (!session && wantsAI) {
        const redirectUrl = req.nextUrl.clone();
        redirectUrl.pathname = "/login";
        redirectUrl.searchParams.set("next", path);
        return NextResponse.redirect(redirectUrl);
    }

    // Se già loggato e prova ad accedere al login → redirect ad /ai
    if (session && isAuthPage) {
        const redirectUrl = req.nextUrl.clone();
        redirectUrl.pathname = "/ai";
        return NextResponse.redirect(redirectUrl);
    }

    return res;
}

// Pagine a cui il middleware si applica
export const config = {
    matcher: ["/ai", "/login"],
};
