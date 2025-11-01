import { supabaseServer } from "@/lib/ai/supabaseServer";
import AIHome from "./AIHome";
import Link from "next/link";

export default async function AIPage() {
    const supabase = supabaseServer();
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;

    // se non c'è sessione → mostra messaggio di login
    if (!user) {
        return (
            <div className="max-w-3xl mx-auto pt-24 px-6 text-center">
                <h1 className="text-3xl font-semibold mb-6">Accedi per usare l’AI</h1>
                <p className="text-gray-600 mb-8">
                    Per iniziare a creare i tuoi piani e ricette personalizzati, accedi o crea un account gratuito.
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

    // se c’è sessione → mostra le chat
    return (
        <div className="max-w-4xl mx-auto pt-24 px-6">
            <h1 className="text-3xl font-semibold mb-4">Le tue chat</h1>
            <p className="text-gray-600 mb-6">
                Benvenuto, <strong>{user.email}</strong>
            </p>

            <AIHome />
        </div>
    );
}

