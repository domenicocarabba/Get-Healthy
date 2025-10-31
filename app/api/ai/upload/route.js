import { writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { GoogleAIFileManager } from "@google/generative-ai/server";

export const runtime = "nodejs";

const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);

export async function POST(req) {
    try {
        const form = await req.formData();
        const file = form.get("file");
        if (!file) return Response.json({ error: "Nessun file" }, { status: 400 });

        const name = form.get("name") || file.name || `upload-${Date.now()}`;
        const mimeType = file.type || "application/octet-stream";

        const buf = Buffer.from(await file.arrayBuffer());
        const tempPath = join(tmpdir(), `${Date.now()}-${name}`);
        await writeFile(tempPath, buf);

        const uploaded = await fileManager.uploadFile(tempPath, {
            mimeType,
            displayName: name,
        });

        return Response.json({
            ok: true,
            name,
            mimeType,
            uri: uploaded?.file?.uri,
        });
    } catch (err) {
        console.error("Upload error:", err);
        return Response.json({ error: "Errore upload file" }, { status: 500 });
    }
}
