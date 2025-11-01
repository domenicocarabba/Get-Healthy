import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/ai/supabaseServer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AccountPage() {
    const sb = supabaseServer();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) redirect("/login?redirect=/account");

    const { data: profile } = await sb
        .from("profiles")
        .select("plan, tokens, token_limit, tokens_used, cycle_start")
        .eq("id", user.id)
        .single();

    const plan = profile?.plan ?? "base";
    const tokens = profile?.tokens ?? null;
    const tokenLimit = profile?.token_limit ?? null;
    const tokensUsed = profile?.tokens_used ?? null;
    const cycleStart = profile?.cycle_start ?? null;

    return (
        <main className="mx-auto max-w-3xl px-6 py-12">
            <h1 className="text-2xl font-semibold mb-6">Il mio account</h1>
            <div className="grid gap-4">
                <section className="rounded-xl border p-5">
                    <h2 className="font-medium mb-3">Profilo</h2>
                    <div className="text-sm">
                        <div><span className="text-gray-500">Email:</span> {user.email}</div>
                        <div><span className="text-gray-500">Piano:</span> {plan}</div>
                    </div>
                </section>
                <section className="rounded-xl border p-5">
                    <h2 className="font-medium mb-3">Token & limiti</h2>
                    <div className="text-sm space-y-1">
                        {tokenLimit !== null ? (
                            <>
                                <div><span className="text-gray-500">Limite mensile:</span> {tokenLimit}</div>
                                <div><span className="text-gray-500">Usati:</span> {tokensUsed ?? 0}</div>
                                <div><span className="text-gray-500">Rinnovo da:</span> {cycleStart ? new Date(cycleStart).toLocaleDateString() : "—"}</div>
                            </>
                        ) : (
                            <div><span className="text-gray-500">Token disponibili:</span> {tokens ?? "—"}</div>
                        )}
                    </div>
                </section>
                <form action="/api/account/logout" method="post" className="mt-2">
                    <button className="rounded-lg bg-black text-white px-4 py-2 text-sm">Logout</button>
                </form>
            </div>
        </main>
    );
}
