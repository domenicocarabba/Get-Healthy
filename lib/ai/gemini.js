import { GoogleGenerativeAI } from "@google/generative-ai";

export function getGemini() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("Missing GEMINI_API_KEY");
    const genAI = new GoogleGenerativeAI(key);
    const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash-image-preview";
    const model = genAI.getGenerativeModel({ model: modelName });
    return { model, modelName };
}
