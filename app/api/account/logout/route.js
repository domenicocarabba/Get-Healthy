import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/ai/supabaseServer";

export async function POST() {
    const sb = supabaseServer();
    await sb.auth.signOut(); // rimuove i cookie sb-* lato server
    const url = new URL("/login", process.env.NEXT_PUBLIC_SITE_URL || "https://gethealthy.it");
    return NextResponse.redirect(url);
}
