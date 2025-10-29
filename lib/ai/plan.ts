// /lib/plan.ts
export type Plan = "base" | "plus" | "pro";

export const PLANS: Record<Plan, { name: string; maxOutput: number; monthlyCap: number; rps: number }> = {
    base: { name: "Base", maxOutput: 512, monthlyCap: 40_000, rps: 1 },
    plus: { name: "Plus", maxOutput: 1024, monthlyCap: 300_000, rps: 3 },
    pro: { name: "Pro", maxOutput: 2048, monthlyCap: 1_000_000, rps: 6 },
};

export function getActivePlan(): Plan {
    if (typeof window === "undefined") return "base";
    const v = (localStorage.getItem("gh_plan") || "base") as Plan;
    return (["base", "plus", "pro"] as Plan[]).includes(v) ? v : "base";
}

// ---- Simple usage meter (MVP) ----
type Usage = { month: string; tokens: number };
const USAGE_KEY = "gh_usage_v1";

export function getUsage(): Usage {
    if (typeof window === "undefined") return { month: "server", tokens: 0 };
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${now.getMonth() + 1}`;
    try {
        const raw = JSON.parse(localStorage.getItem(USAGE_KEY) || "{}");
        if (!raw.month || raw.month !== monthKey) return { month: monthKey, tokens: 0 };
        return { month: raw.month, tokens: Number(raw.tokens) || 0 };
    } catch {
        return { month: monthKey, tokens: 0 };
    }
}

export function addUsage(tokens: number) {
    if (typeof window === "undefined") return;
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${now.getMonth() + 1}`;
    const cur = getUsage();
    const next: Usage = { month: monthKey, tokens: (cur.tokens || 0) + Math.max(0, tokens || 0) };
    localStorage.setItem(USAGE_KEY, JSON.stringify(next));
}

export function resetUsageIfNewMonth() {
    // basta chiamare getUsage(); fa già rollover
    getUsage();
}
