import { NextResponse } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req) {
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req, res });

    // Ottieni la sessione attuale (se l'utente è loggato)
    const {
        data: { session },
    } = await supabase.auth.getSession();

    const url = req.nextUrl;
    const pathname = url.pathname;
    const search = url.search || "";

    // Definisce quali pagine sono "protette"
    const isProtected =
        pathname.startsWith("/ai") || pathname.startsWith("/account");

    // Se NON loggato e tenta di accedere a una pagina protetta → reindirizza al login
    if (!session && isProtected) {
        const loginUrl = url.clone();
        loginUrl.pathname = "/login";
        loginUrl.searchParams.set("next", pathname + search);
        return NextResponse.redirect(loginUrl);
    }

    // Se è loggato oppure è su una pagina pubblica → continua
    return res;
}

// Limita il middleware solo alle sezioni che ti servono
export const config = {
    matcher: ["/ai/:path*", "/account/:path*"],
};
