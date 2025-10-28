"use client";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function SuccessPage() {
    const params = useSearchParams();
    const plan = params.get("plan");

    useEffect(() => {
        if (plan) localStorage.setItem("gh_plan", plan);
    }, [plan]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center text-center">
            <h1 className="text-3xl font-bold text-green-600 mb-4">Pagamento completato!</h1>
            <p className="text-gray-700">
                Hai attivato il piano <strong>{plan.toUpperCase()}</strong>.
                Ora puoi tornare alla tua <a href="/ai" className="text-green-600 underline">AI</a>.
            </p>
        </div>
    );
}
