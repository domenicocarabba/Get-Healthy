import { Redis } from "@upstash/redis";

function clean(v?: string) {
    // rimuove apici doppi/singoli/backtick ai bordi e spazi
    return (v ?? "").trim().replace(/^["'`]+|["'`]+$/g, "");
}

const restUrl =
    clean(process.env.UPSTASH_REDIS_REST_URL) ||
    clean(process.env.KV_REST_API_URL);

const restToken =
    clean(process.env.UPSTASH_REDIS_REST_TOKEN) ||
    clean(process.env.KV_REST_API_TOKEN);

// blocca errori tipici: URL redis al posto di REST o stringhe vuote
if (!restUrl || !restToken) {
    throw new Error("Redis REST env missing: set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN");
}
if (restUrl.startsWith("rediss://")) {
    throw new Error("You passed a Redis URL (rediss://...). Use the REST URL (https://...upstash.io).");
}

export const redis = new Redis({ url: restUrl, token: restToken });
