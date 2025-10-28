// app/success/page.jsx
export const dynamic = "force-dynamic"; // evita SSG

export default function Page({ searchParams }) {
    const sessionId = searchParams?.session_id ?? null;

    return (
        <div className="max-w-2xl mx-auto py-16 px-6">
            <h1 className="text-3xl font-semibold mb-4">Pagamento riuscito ✅</h1>
            <p className="mb-2">Grazie! Il tuo ordine è stato ricevuto.</p>
            <p className="text-sm text-gray-500">
                {sessionId ? `Session ID: ${sessionId}` : "Nessun session_id nei parametri."}
            </p>
        </div>
    );
}
