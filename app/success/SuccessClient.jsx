"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function SuccessClient() {
  const sp = useSearchParams();
  const router = useRouter();
  const sessionId = sp.get("session_id");
  const planFromQS = sp.get("plan");

  const [status, setStatus] = useState("checking");
  const [plan, setPlan] = useState("");

  useEffect(() => {
    async function run() {
      if (!sessionId && planFromQS === "base") {
        try { localStorage.setItem("gh_plan", "base"); } catch {}
        setPlan("base");
        setStatus("ok");
        return;
      }

      if (!sessionId) {
        setStatus("fail");
        return;
      }

      try {
        const res = await fetch(`/api/checkout/verify?session_id=${sessionId}`);
        const data = await res.json();
        if (data.ok && data.plan) {
          try { localStorage.setItem("gh_plan", data.plan); } catch {}
          setPlan(String(data.plan));
          setStatus("ok");
        } else {
          setStatus("fail");
        }
      } catch {
        setStatus("fail");
      }
    }
    run();
  }, [sessionId, planFromQS]);

  if (status === "checking") {
    return (
      <div className="max-w-2xl mx-auto py-16 px-6">
        <h1 className="text-2xl font-semibold mb-2">Verifica pagamento…</h1>
        <p className="text-gray-500">Un attimo, sto controllando con Stripe.</p>
      </div>
    );
  }

  if (status === "fail") {
    return (
      <div className="max-w-2xl mx-auto py-16 px-6">
        <h1 className="text-2xl font-semibold mb-2">Pagamento non verificato</h1>
        <p className="text-gray-500">
          Se hai chiuso la finestra prima di completare, torna ai{" "}
          <a href="/pricing" className="underline text-green-600">Piani</a>.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-16 px-6">
      <h1 className="text-3xl font-semibold mb-4">Pagamento riuscito ✅</h1>
      <p className="mb-2">Grazie! Il tuo ordine è stato ricevuto.</p>
      {plan && (
        <p className="text-sm text-gray-500">
          Piano attivato: <b>{plan.toUpperCase()}</b>
        </p>
      )}
      <div className="mt-6">
        <a
          href="/ai"
          className="inline-block rounded-lg bg-green-600 text-white px-4 py-2 hover:bg-green-700"
        >
          Vai alla chat AI
        </a>
      </div>
    </div>
  );
}
