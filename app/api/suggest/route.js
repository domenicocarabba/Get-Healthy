import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req) {
    try {
        const { lastMessages = [] } = await req.json();
        const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genai.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-2.5-flash-image-preview" });
        const { response } = await model.generateContent(
            `In base a questa conversazione, proponi 4 suggerimenti di richieste, elenco JSON puro: ["...","..."].\n\n${JSON.stringify(lastMessages)}`
        );
        let out = [];
        try { out = JSON.parse(response.text()); } catch { out = []; }
        return NextResponse.json({ ok: true, suggestions: out.slice(0, 4) });
    } catch (e) {
        return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
    }
}
