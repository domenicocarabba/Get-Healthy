// /app/ai/page.jsx
import { supabaseServer } from "@/lib/ai/supabaseServer";
import AIHome from "./AIHome";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AIPage() {
    let user = null;

    // Proteggi la lettura della sessione da errori SSR/env
    try {
        const supabase = supabaseServer();
        const { data: { session } } = await supabase.auth.getSession();
        user = session?.user || null;
    } catch (e) {
        console.error("AIPage session error:", e);
        user = null; // fallback sicuro
    }

    // 🔒 Nessuna sessione → messaggio login
    if (!user) {
        return (
            <div className="max-w-3xl mx-auto pt-24 px-6 text-center">
                <h1 className="text-3xl font-semibold mb-6">
                    Accedi per usare l’intelligenza artificiale di Get Healthy
                </h1>
                <p className="text-gray-600 mb-8">
                    Per iniziare a creare piani personalizzati, ricevere ricette e accedere al tuo assistente AI,
                    accedi o crea un account gratuito.
                </p>
                <div className="flex justify-center gap-4">
                    <Link
                        href="/accedi"
                        className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition"
                    >
                        Accedi
                    </Link>
                    <Link
                        href="/registrati"
                        className="border border-black px-6 py-3 rounded-lg hover:bg-gray-100 transition"
                    >
                        Crea account
                    </Link>
                </div>
            </div>
        );
    }

    // ✅ Utente autenticato → interfaccia AI
    return (
        <div className="max-w-5xl mx-auto pt-24 px-6">
            <h1 className="text-3xl font-semibold mb-4">Le tue chat</h1>
            <p className="text-gray-600 mb-8">
                Benvenuto, <strong>{user.email}</strong>
            </p>
            <AIHome />
        </div>
    );
}
