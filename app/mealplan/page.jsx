"use client";

import { useEffect, useState } from "react";

// (opzionale ma utile) evita SSG/ISR su questa pagina
export const dynamic = "force-dynamic";

export default function MealplanPage() {
    const [plan, setPlan] = useState("base"); // letto dopo in useEffect
    const [days, setDays] = useState(7);
    const [mealsPerDay, setMealsPerDay] = useState(3);
    const [prefs, setPrefs] = useState("");
    const [planData, setPlanData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Leggi localStorage solo lato client
    useEffect(() => {
        try {
            const stored =
                typeof window !== "undefined" ? localStorage.getItem("gh_plan") : null;
            setPlan(stored || "base");
        } catch {
            // in caso di blocchi privacy, rimani su "base"
            setPlan("base");
        }
    }, []);

    async function generatePlan() {
        setError("");
        setLoading(true);
        setPlanData(null);

        try {
            const res = await fetch("/api/mealplan", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    plan,                 // ora viene dallo state
                    days,
                    mealsPerDay,
                    prefs: { note: prefs },
                }),
            });

            const data = await res.json();
            if (!res.ok || !data.ok) {
                throw new Error(data?.error || "Errore creazione piano");
            }
            setPlanData(data.plan);
        } catch (e) {
            setError(e.message || "Errore creazione piano");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-24">
            <h1 className="text-4xl font-bold mb-4 text-green-700">Piano Alimentare AI</h1>

            <p className="text-sm text-gray-500 mb-3">
                Piano attivo: <b>{plan}</b>. La generazione dei piani settimanali è disponibile solo nel piano <b>Pro</b>.
            </p>

            {plan !== "pro" && (
                <div className="mb-6 rounded-lg border bg-white p-3 text-sm">
                    Per generare un piano completo passa al piano <a href="/pricing" className="text-green-700 underline font-semibold">Pro</a>.
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <label className="flex flex-col text-sm">
                    Giorni
                    <input
                        type="number"
                        min="1"
                        max="14"
                        value={days}
                        onChange={(e) => setDays(Number(e.target.value))}
                        className="border rounded p-2"
                    />
                </label>

                <label className="flex flex-col text-sm">
                    Pasti al giorno
                    <input
                        type="number"
                        min="1"
                        max="6"
                        value={mealsPerDay}
                        onChange={(e) => setMealsPerDay(Number(e.target.value))}
                        className="border rounded p-2"
                    />
                </label>

                <label className="flex flex-col text-sm md:col-span-1">
                    Preferenze / dieta
                    <input
                        type="text"
                        value={prefs}
                        onChange={(e) => setPrefs(e.target.value)}
                        placeholder="Es. vegetariana, 1800 kcal..."
                        className="border rounded p-2"
                    />
                </label>
            </div>

            <button
                onClick={generatePlan}
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
                {loading ? "Generazione..." : "Genera piano settimanale"}
            </button>

            {error && <p className="text-red-600 mt-3">{error}</p>}

            {planData && (
                <div className="mt-8 space-y-6">
                    {planData.days?.map((d) => (
                        <div key={d.day} className="border rounded-xl p-4 bg-white shadow">
                            <h2 className="text-xl font-semibold mb-2">Giorno {d.day}</h2>
                            {d.meals?.map((m, i) => (
                                <div key={i} className="mb-2 text-sm">
                                    <b>{m.name}</b> — {m.macros?.kcal} kcal <br />
                                    {m.recipe}
                                </div>
                            ))}
                            <p className="text-xs text-gray-500">
                                Totale giorno: {d.total_macros?.kcal} kcal
                            </p>
                        </div>
                    ))}

                    {planData.shopping_list && (
                        <div className="border rounded-xl p-4 bg-white shadow">
                            <h3 className="text-lg font-semibold mb-2">Lista della Spesa</h3>
                            <ul className="text-sm list-disc list-inside">
                                {planData.shopping_list.map((it, i) => (
                                    <li key={i}>
                                        {it.item} — {it.qty} {it.unit}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
