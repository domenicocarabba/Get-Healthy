"use client";

import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/ai/supabaseClient";
import AIHome from "./AIHome"; // il tuo componente client

export default function AIPage() {
    const supabase = supabaseClient();
    const [ready, setReady] = useState(false);
    const [userEmail, setUserEmail] = useState("");

    useEffect(() => {
        (async () => {
            try {
                const { data } = await supabase.auth.getUser();
                if (!data?.user) {
                    // non loggato → porta al login
                    window.location.replace("/login?next=/ai");
                    return;
                }
                setUserEmail(data.user.email || "");
            } catch {
                // in caso di errore, manda comunque al login
                window.location.replace("/login?next=/ai");
                return;
            }
            setReady(true);
        })();
    }, [supabase]);

    if (!ready) {
        return (
            <div className="max-w-4xl mx-auto pt-24 px-6">
                <p>Caricamento…</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto pt-24 px-6">
            <h1 className="text-3xl font-semibold mb-2">Le tue chat</h1>
            {userEmail && (
                <p className="text-gray-600 mb-6">
                    Benvenuto, <strong>{userEmail}</strong>
                </p>
            )}
            <AIHome />
        </div>
    );
}
