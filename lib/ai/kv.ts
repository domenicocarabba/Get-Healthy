import { Redis } from "@upstash/redis";

function clean(v?: string) {
    return (v ?? "").trim().replace(/^"+|"+$/g, "");
}

const url =
    clean(process.env.UPSTASH_REDIS_REST_URL) ||
    clean(process.env.KV_REST_API_URL);

const token =
    clean(process.env.UPSTASH_REDIS_REST_TOKEN) ||
    clean(process.env.KV_REST_API_TOKEN);

if (!url || !token) {
    throw new Error("Redis env missing: UPSTASH_REDIS_REST_URL/TOKEN or KV_REST_...");
}

export const redis = new Redis({ url, token });
// oppure: export const redis = Redis.fromEnv(); // se sei sicuro delle env
