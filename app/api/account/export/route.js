import { NextResponse } from "next/server";
import { supabaseRoute } from "@/lib/ai/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET() {
    const sb = supabaseRoute();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const tables = [
        ["profiles", "id"],
        ["diet_settings", "user_id"],
        ["health_metrics", "user_id"],
        ["goals", "user_id"],
        ["allergies", "user_id"],
        ["saved_recipes", "user_id"],
        ["meal_plans", "user_id"],
        ["workouts", "user_id"],
        ["workout_sessions", "user_id"],
        ["user_consents", "user_id"],
        ["messages", "user_id"],
        ["threads", "user_id"],
    ];

    const payload = { exported_at: new Date().toISOString(), user_id: user.id, data: {} };

    for (const [table, col] of tables) {
        const { data, error } = await sb.from(table).select("*").eq(col, user.id);
        payload.data[table] = error ? { error: error.message } : data;
    }

    const body = JSON.stringify(payload, null, 2);
    return new NextResponse(body, {
        status: 200,
        headers: {
            "Content-Type": "application/json",
            "Content-Disposition": 'attachment; filename="gethealthy-mydata.json"',
        },
    });
}
