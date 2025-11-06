// /lib/ai/gemini.js
import { VertexAI } from "@google-cloud/vertexai";
import fs from "fs";

/** Modello unico per tutti i piani (stabile nel tuo progetto) */
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const LOCATION = process.env.GEMINI_LOCATION || "us-central1";
const PROJECT = process.env.GEMINI_PROJECT_ID;

/**
 * Supporto Vercel: se non hai un file locale ma hai la variabile
 * GOOGLE_CREDENTIALS_JSON, scriviamo il JSON in /tmp e impostiamo
 * GOOGLE_APPLICATION_CREDENTIALS al volo.
 */
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && process.env.GOOGLE_CREDENTIALS_JSON) {
    try {
        const tmpPath = "/tmp/vertex-key.json"; // unico path scrivibile su Vercel
        fs.writeFileSync(tmpPath, process.env.GOOGLE_CREDENTIALS_JSON);
        process.env.GOOGLE_APPLICATION_CREDENTIALS = tmpPath;
    } catch (e) {
        console.error("Impossibile scrivere le credenziali in /tmp:", e);
    }
}

/** Converte i tuoi messaggi in 'contents' per Gemini */
function messagesToContents(messages = [], system = "") {
    const contents = [];
    if (system) {
        contents.push({ role: "user", parts: [{ text: `SYSTEM:\n${system}` }] });
        contents.push({ role: "model", parts: [{ text: "Ok, seguirò queste istruzioni." }] });
    }
    for (const m of messages) {
        const role = m.role === "assistant" ? "model" : "user";
        contents.push({ role, parts: [{ text: String(m.content || "") }] });
    }
    return contents;
}

/**
 * API usata dalla tua route: genera testo usando la history.
 * Ritorna: { text, usage, model }
 */
export async function generateWithHistory({
    messages,
    system,
    temperature = 0.7,
    maxOutputTokens = 1024,
}) {
    if (!PROJECT) throw new Error("Missing GEMINI_PROJECT_ID");
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS)
        throw new Error("Missing GOOGLE_APPLICATION_CREDENTIALS (file o JSON)");

    const vertexAI = new VertexAI({ project: PROJECT, location: LOCATION });
    const model = vertexAI.getGenerativeModel({ model: MODEL_NAME });

    const contents = messagesToContents(messages, system);

    const result = await model.generateContent({
        contents,
        generationConfig: { temperature, maxOutputTokens },
    });

    const resp = result?.response;
    // Vertex espone .text(); in fallback prendi dalle parts se assente
    const text = resp?.text ? resp.text()
        : (resp?.candidates?.[0]?.content?.parts?.map(p => p.text).join("") || "");
    const usage = resp?.usageMetadata || { totalTokenCount: 0 };

    return { text, usage, model: MODEL_NAME };
}

export function getModelName() {
    return MODEL_NAME;
}
