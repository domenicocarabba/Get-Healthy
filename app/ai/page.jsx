import { supabaseServer } from "@/lib/ai/supabaseServer";
import AIHome from "./AIHome"; // lascia il tuo client component

export default async function AIPage() {
    // Leggi sessione lato server
    const supabase = supabaseServer();
    const {
        data: { session },
        error,
    } = await supabase.auth.getSession();

    const user = session?.user || null;

    return (
        <div className="max-w-4xl mx-auto pt-24 px-6">
            <h1 className="text-3xl font-semibold mb-4">Le tue chat</h1>

            {user ? (
                <p className="text-gray-600 mb-6">
                    Benvenuto, <strong>{user.email}</strong>
                </p>
            ) : (
                <div className="mb-6 rounded border border-amber-300 bg-amber-50 p-3 text-amber-800">
                    Nessuna sessione trovata. Se vedi questo messaggio, il middleware non
                    ha intercettato l’accesso non autenticato.
                </div>
            )}

            {/* Componente client che gestisce la logica AI */}
            <AIHome />
        </div>
    );
}
