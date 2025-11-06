"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabaseClient } from "@/lib/ai/supabaseClient";

function Card({ title, right, children, className = "" }) {
    return (
        <div
            className={`bg-gray-900/70 text-gray-100 border border-gray-800 rounded-2xl p-5 shadow-lg backdrop-blur-md ${className}`}
        >
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-white">{title}</h3>
                {right}
            </div>
            {children}
        </div>
    );
}

function Pill({ children, tone = "emerald" }) {
    const tones = {
        emerald: "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30",
        sky: "bg-sky-500/20 text-sky-300 border border-sky-400/30",
        zinc: "bg-white/10 text-white/70 border border-white/20",
    };
    return (
        <span
            className={`px-2.5 py-1 rounded-full text-xs font-medium ${tones[tone] || tones.zinc}`}
        >
            {children}
        </span>
    );
}

export default function AccountPage() {
    const sb = supabaseClient();
    const [email, setEmail] = useState("");
    const [plan, setPlan] = useState("base");
    const [tokenCap, setTokenCap] = useState(50_000);
    const [tokenUsed, setTokenUsed] = useState(0);
    const usedPct = Math.min(100, Math.round((tokenUsed / tokenCap) * 100) || 0);

    useEffect(() => {
        (async () => {
            const { data } = await sb.auth.getUser();
            setEmail(data?.user?.email || "");
        })();
    }, [sb]);

    async function logout() {
        await sb.auth.signOut();
        window.location.replace("/");
    }

    return (
        <main className="relative min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black text-white">
            {/* soft decorative gradient */}
            <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute top-[-10%] left-[5%] h-64 w-64 bg-emerald-500/30 blur-3xl rounded-full" />
                <div className="absolute bottom-[5%] right-[10%] h-64 w-64 bg-sky-500/20 blur-3xl rounded-full" />
            </div>

            <section className="max-w-5xl mx-auto px-6 py-20">
                <motion.header
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-10"
                >
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
                        Il mio account
                    </h1>
                    <p className="text-gray-400 text-sm">
                        Gestisci piano, limiti e sessione.
                    </p>
                </motion.header>

                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.05 }}
                    className="grid gap-6 md:grid-cols-5"
                >
                    {/* Profilo */}
                    <Card
                        title="Profilo"
                        className="md:col-span-3"
                        right={<Pill tone="emerald">AI in allenamento continuo</Pill>}
                    >
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-400">Email</span>
                                <span>{email || "—"}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-400">Piano</span>
                                <div className="flex items-center gap-2">
                                    <Pill tone={plan === "pro" ? "sky" : "emerald"}>
                                        {plan}
                                    </Pill>
                                    <a
                                        href="/piani"
                                        className="text-xs underline text-gray-400 hover:text-white"
                                    >
                                        Cambia piano
                                    </a>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Token */}
                    <Card
                        title="Token & limiti"
                        className="md:col-span-2"
                        right={<span className="text-xs text-gray-400">{usedPct}% del mese</span>}
                    >
                        <div className="space-y-3">
                            <div className="h-2 w-full rounded-full bg-gray-800 overflow-hidden">
                                <div
                                    className="h-full bg-emerald-500 rounded-full transition-[width]"
                                    style={{ width: `${usedPct}%` }}
                                />
                            </div>
                            <div className="flex items-center justify-between text-sm text-gray-300">
                                <span>Usati</span>
                                <span className="tabular-nums">
                                    {Intl.NumberFormat("it-IT").format(tokenUsed)} /{" "}
                                    {Intl.NumberFormat("it-IT").format(tokenCap)}
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <a
                                    href="/piani"
                                    className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm text-gray-100"
                                >
                                    Vedi piani
                                </a>
                                <a
                                    href="/piani#upgrade"
                                    className="px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm"
                                >
                                    Upgrade
                                </a>
                            </div>
                        </div>
                    </Card>

                    {/* Sessione */}
                    <Card title="Sessione" className="md:col-span-5">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <p className="text-sm text-gray-300">
                                Sei loggato come <span className="font-medium">{email || "—"}</span>
                            </p>
                            <div className="flex gap-2">
                                <a
                                    href="/ai"
                                    className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm text-gray-100"
                                >
                                    Vai alla AI
                                </a>
                                <button
                                    onClick={logout}
                                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    </Card>
                </motion.div>
            </section>
        </main>
    );
}
