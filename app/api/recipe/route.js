import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req) {
    try {
        const { plan = "base", prefs = {}, brief = "pasta al pomodoro proteica", servings = 1 } = await req.json();
        const maxOut = plan === "pro" ? 1024 : plan === "plus" ? 768 : 512;

        const sys = `Sei un assistente culinario-nutrizionista. Rispondi in JSON valido. 
Campi: name, servings, prep_minutes, cook_minutes, ingredients:[{item, qty, unit}], steps:[string], macros:{kcal, protein_g, carbs_g, fat_g}, notes. 
Rispetta allergie e preferenze: ${JSON.stringify(prefs)}.`;

        const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genai.getGenerativeModel({
            model: process.env.GEMINI_MODEL || "gemini-2.5-flash-image-preview",
            systemInstruction: sys,
            generationConfig: { maxOutputTokens: maxOut, temperature: 0.6 }
        });

        const { response } = await model.generateContent(`Crea una ricetta: "${brief}" per ${servings} porzioni. JSON ONLY.`);
        const text = response.text();
        // Proviamo a fare parse sicuro
        let data = {};
        try { data = JSON.parse(text); } catch { data = { raw: text }; }
        return NextResponse.json({ ok: true, recipe: data });
    } catch (e) {
        return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
    }
}
