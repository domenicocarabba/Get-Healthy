import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET() {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        return NextResponse.json({ error: "Auth session missing" }, { status: 401 });
    }

    const userId = session.user.id;
    // Esempio query (sostituisci con la tua tabella):
    // const { data: threads, error } = await supabase
    //   .from("threads")
    //   .select("*")
    //   .eq("user_id", userId)
    //   .order("created_at", { ascending: false });

    return NextResponse.json({ threads: [] });
}
