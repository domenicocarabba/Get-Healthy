import { supabaseServer } from "@/lib/ai/supabaseServer"; // tua util esistente

/** Raccoglie tutti i dati necessari per personalizzare i prompt */
export async function getUserContext(userId) {
    const sb = supabaseServer();

    const [
        { data: profile },
        { data: diet },
        { data: metrics },
        { data: goals },
        { data: allergies },
        { data: workouts },
        { data: savedRecipes }
    ] = await Promise.all([
        sb.from("profiles").select("*").eq("id", userId).maybeSingle(),
        sb.from("diet_settings").select("*").eq("user_id", userId).maybeSingle(),
        sb.from("health_metrics").select("*").eq("user_id", userId).order("updated_at", { ascending: false }).maybeSingle(),
        sb.from("goals").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
        sb.from("allergies").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
        sb.from("workouts").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
        sb.from("saved_recipes").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    ]);

    return {
        profile: profile || {},
        diet: diet || {},
        metrics: metrics || {},
        goals: goals || [],
        allergies: allergies || [],
        workouts: workouts || [],
        savedRecipes: savedRecipes || []
    };
}
