import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req) {
    try {
        const { plan = "base", prefs = {}, days = 7, mealsPerDay = 3, caloriesTarget } = await req.json();
        if (plan !== "pro") return NextResponse.json({ ok: false, error: "plan_required_pro" }, { status: 403 });

        const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genai.getGenerativeModel({
            model: process.env.GEMINI_MODEL || "gemini-2.5-flash-image-preview",
            systemInstruction: `Sei un dietista. Rispondi SOLO JSON con schema:
{
 days:[{ day:number, meals:[{name, recipe, macros:{kcal,protein_g,carbs_g,fat_g}, ingredients:[{item,qty,unit}]}], total_macros:{kcal,protein_g,carbs_g,fat_g} }],
 shopping_list:[{item, qty, unit}]
}
Preferenze: ${JSON.stringify(prefs)}. Target calorie giornaliere: ${caloriesTarget || "auto"}.`,
            generationConfig: { maxOutputTokens: 2048, temperature: 0.6 }
        });

        const { response } = await model.generateContent(`Crea un piano alimentare di ${days} giorni con ${mealsPerDay} pasti/giorno. JSON ONLY.`);
        let planJson = {};
        try { planJson = JSON.parse(response.text()); } catch { planJson = { raw: response.text() }; }
        return NextResponse.json({ ok: true, plan: planJson });
    } catch (e) {
        return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
    }
}
