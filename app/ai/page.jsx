import { supabaseServer } from "@/lib/ai/supabaseServer";
import AIHome from "./AIHome"; // se il tuo componente client è qui, altrimenti cambia il path

export default async function AIPage() {
    // Ottieni la sessione attiva lato server
    const supabase = supabaseServer();
    const { data: { session } } = await supabase.auth.getSession();

    // (Grazie al middleware, qui arrivi solo se loggato)
    const user = session?.user;

    return (
        <div className="max-w-4xl mx-auto pt-24 px-6">
            <h1 className="text-3xl font-semibold mb-4">Le tue chat</h1>
            {user && (
                <p className="text-gray-600 mb-6">
                    Benvenuto, <strong>{user.email}</strong>
                </p>
            )}

            {/* Componente client che gestisce la logica AI */}
            <AIHome />
        </div>
    );
}