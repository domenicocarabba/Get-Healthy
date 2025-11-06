// app/components/Header.jsx
"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/ai/supabaseClient";
import HeaderLogo from "./HeaderLogo";
import { RefreshCcw } from "lucide-react";

export default function Header() {
    const sb = supabaseClient();
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [open, setOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        sb.auth.getUser().then(({ data }) => setUser(data?.user || null));
        const { data: { subscription } } = sb.auth.onAuthStateChange((_e, session) => {
            setUser(session?.user || null);
        });
        return () => subscription?.unsubscribe();
    }, [sb]);

    useEffect(() => {
        function onClickOutside(e) {
            if (open && menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
        }
        function onKey(e) {
            if (e.key === "Escape") setOpen(false);
        }
        document.addEventListener("click", onClickOutside);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("click", onClickOutside);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    async function logout() {
        try { await fetch("/api/account/logout", { method: "POST" }); } catch { }
        await sb.auth.signOut();
        setOpen(false);
        router.push("/login");
        router.refresh();
    }

    return (
        <header className="fixed top-0 w-full border-b bg-white/90 backdrop-blur z-50">
            <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
                {/* Brand + micro-badge */}
                <div className="flex items-center gap-3">
                    <Link href="/" className="flex items-center gap-2">
                        <HeaderLogo size={28} />
                        <span className="font-semibold hidden sm:inline">Get Healthy</span>
                    </Link>
                    <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-100">
                        <RefreshCcw className="h-3.5 w-3.5" />
                        AI in allenamento continuo
                    </span>
                </div>

                {/* Nav */}
                <nav className="flex items-center gap-6">
                    <Link href="/" className="text-sm hover:text-green-700">Home</Link>
                    <Link href="/ai" className="text-sm hover:text-green-700">AI</Link>
                    <Link href="/piani" className="text-sm hover:text-green-700">Piani</Link>
                    <Link href="/about" className="text-sm hover:text-green-700">About</Link>

                    {!user ? (
                        <Link
                            href="/login"
                            className="rounded bg-black text-white px-3 py-1.5 text-sm hover:bg-gray-800"
                        >
                            Accedi
                        </Link>
                    ) : (
                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={() => setOpen(v => !v)}
                                className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-gray-100"
                                aria-haspopup="menu"
                                aria-expanded={open}
                                title={user.email || "Account"}
                                aria-label={user.email ? `Account di ${user.email}` : "Il mio account"}
                            >
                                <div className="size-6 rounded-full bg-gray-900 text-white grid place-items-center text-xs">
                                    {user.email?.[0]?.toUpperCase() || "U"}
                                </div>
                                {/* Mostra il testo “Il mio account”; su schermi piccoli nascondilo */}
                                <span className="text-sm hidden sm:inline">Il mio account</span>
                            </button>

                            {open && (
                                <div
                                    role="menu"
                                    className="absolute right-0 mt-2 w-56 rounded-lg border bg-white shadow z-50 overflow-hidden"
                                >
                                    <div className="px-3 py-2 text-xs text-gray-500 border-b">
                                        {user.email}
                                    </div>

                                    <Link
                                        href="/account"
                                        onClick={() => setOpen(false)}
                                        className="block px-3 py-2 text-sm hover:bg-gray-50"
                                        role="menuitem"
                                    >
                                        Profilo
                                    </Link>

                                    <Link
                                        href="/account/health"
                                        onClick={() => setOpen(false)}
                                        className="block px-3 py-2 text-sm hover:bg-gray-50"
                                        role="menuitem"
                                    >
                                        Dati salute
                                    </Link>

                                    <Link
                                        href="/account/data"
                                        onClick={() => setOpen(false)}
                                        className="block px-3 py-2 text-sm hover:bg-gray-50"
                                        role="menuitem"
                                    >
                                        Privacy & Dati
                                    </Link>

                                    <div className="my-1 h-px bg-gray-100" aria-hidden="true" />

                                    <button
                                        onClick={logout}
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-red-600"
                                        role="menuitem"
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
