export const runtime = "nodejs";
export async function GET() {
    const key = process.env.GEMINI_API_KEY || "";
    return new Response(
        JSON.stringify({
            hasKey: Boolean(key),
            prefix: key ? key.slice(0, 5) : null,
            length: key.length,
        }),
        { headers: { "Content-Type": "application/json" } }
    );
}
