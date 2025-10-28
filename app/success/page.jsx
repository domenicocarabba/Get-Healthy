import { Suspense } from "react";
import SuccessClient from "./SuccessClient";

// Evita il pre-render statico che causa l'errore in export
export const dynamic = "force-dynamic"; // (in alternativa: export const revalidate = 0)

export default function Page() {
    return (
        <Suspense fallback={<div className="p-6">Loading…</div>}>
            <SuccessClient />
        </Suspense>
    );
}
