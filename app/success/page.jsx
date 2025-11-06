// app/success/page.jsx
import { Suspense } from "react";
import SuccessClient from "./SuccessClient";

// ✅ Evita il pre-render statico: la pagina deve essere dinamica
export const dynamic = "force-dynamic";

// ✅ Metadata opzionale (per SEO e tab del browser)
export const metadata = {
    title: "Pagamento riuscito – Get Healthy",
    description: "Grazie per il tuo ordine! Il pagamento è stato completato con successo.",
};

export default function Page() {
    return (
        <Suspense fallback={<div className="p-6">Loading…</div>}>
            <SuccessClient />
        </Suspense>
    );
}
