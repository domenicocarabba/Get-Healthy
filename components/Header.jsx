"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/ai/supabaseClient";

export default function Header() {
    const sb = supabaseClient();
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        sb.auth.getUser().then(({ data }) => setUser(data?.user || null));
        const { data: { subscription } } = sb.auth.onAuthStateChange((_e, session) => {
            setUser(session?.user || null);
        });
        return () => subscription?.unsubscribe();
    }, [sb]);

    async function logout() {
        try { await fetch("/api/account/logout", { method: "POST" }); } catch { }
        await sb.auth.signOut();
        setOpen(false);
        router.push("/login");
        router.refresh();
    }

    return (
        <header className="w-full border-b bg-white">
            <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
                <Link href="/" className="font-semibold">Get Healthy</Link>

                <nav className="flex items-center gap-6">
                    <Link href="/ricette" className="text-sm">Ricette</Link>
                    <Link href="/ai" className="text-sm">AI</Link>
                    {/* ✅ Piani sempre visibile */}
                    <Link href="/piani" className="text-sm">Piani</Link>

                    {!user ? (
                        <Link
                            href="/login"
                            className="rounded bg-black text-white px-3 py-1.5 text-sm"
                        >
                            Accedi
                        </Link>
                    ) : (
                        <div className="relative">
                            <button
                                onClick={() => setOpen(v => !v)}
                                className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-gray-100"
                            >
                                <div className="size-6 rounded-full bg-gray-900 text-white grid place-items-center text-xs">
                                    {user.email?.[0]?.toUpperCase() || "U"}
                                </div>
                                <span className="text-sm max-w-40 truncate">{user.email}</span>
                            </button>

                            {open && (
                                <div className="absolute right-0 mt-2 w-56 rounded-lg border bg-white shadow z-50">
                                    <Link
                                        href="/account"
                                        onClick={() => setOpen(false)}
                                        className="block px-3 py-2 text-sm hover:bg-gray-50"
                                    >
                                        Il mio account
                                    </Link>
                                    <button
                                        onClick={logout}
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-red-600"
                                    >
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </nav>
            </div>
        </header>
    );
}
