"use client";

import { useEffect, useState } from "react";

// opzionale: evita SSG/ISR su questa pagina
export const dynamic = "force-dynamic";

export default function RecipesPage() {
    const [plan, setPlan] = useState("base");        // letto dal client in useEffect
    const [prompt, setPrompt] = useState("");
    const [recipe, setRecipe] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Leggi localStorage solo lato client
    useEffect(() => {
        try {
            const stored =
                typeof window !== "undefined" ? localStorage.getItem("gh_plan") : null;
            setPlan(stored || "base");
        } catch {
            setPlan("base");
        }
    }, []);

    async function generateRecipe() {
        if (!prompt.trim()) return;
        setError("");
        setLoading(true);
        setRecipe(null);

        try {
            const res = await fetch("/api/recipe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ plan, brief: prompt, servings: 1 }),
            });

            const data = await res.json();
            if (!res.ok || !data.ok) throw new Error(data?.error || "Errore generazione ricetta");

            setRecipe(data.recipe);
        } catch (e) {
            setError(e.message || "Errore generazione ricetta");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-3xl mx-auto px-4 py-24">
            <h1 className="text-4xl font-bold mb-4 text-green-700">Generatore di Ricette AI</h1>
            <p className="text-sm text-gray-500 mb-8">
                Piano attivo: <b>{plan}</b>. Le ricette dettagliate (macro, tempi, ecc.) sono incluse da <b>Plus</b> in su.
            </p>

            <textarea
                className="w-full border rounded-lg p-3 mb-3"
                rows={3}
                placeholder="Es. 'ricetta proteica con pollo e 500 kcal'"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
            />

            <button
                onClick={generateRecipe}
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
                {loading ? "Generazione..." : "Genera Ricetta"}
            </button>

            {error && <p className="text-red-600 mt-3">{error}</p>}

            {recipe && (
                <div className="mt-8 border rounded-2xl p-6 bg-white shadow">
                    <h2 className="text-2xl font-bold mb-2">{recipe.name}</h2>
                    <p className="text-sm text-gray-500 mb-4">
                        Porzioni: {recipe.servings} — Prep: {recipe.prep_minutes} min, Cottura: {recipe.cook_minutes} min
                    </p>

                    {recipe.macros && (
                        <div className="text-sm mb-4 text-gray-600">
                            <b>Macro:</b> {recipe.macros.kcal} kcal · {recipe.macros.protein_g}g proteine ·{" "}
                            {recipe.macros.carbs_g}g carbo · {recipe.macros.fat_g}g grassi
                        </div>
                    )}

                    <h3 className="font-semibold mt-4 mb-2">Ingredienti:</h3>
                    <ul className="list-disc list-inside text-sm mb-4">
                        {recipe.ingredients?.map((ing, i) => (
                            <li key={i}>
                                {ing.qty} {ing.unit} {ing.item}
                            </li>
                        ))}
                    </ul>

                    <h3 className="font-semibold mb-2">Procedimento:</h3>
                    <ol className="list-decimal list-inside text-sm space-y-1">
                        {recipe.steps?.map((s, i) => (
                            <li key={i}>{s}</li>
                        ))}
                    </ol>

                    {recipe.notes && <p className="text-sm mt-4 italic">{recipe.notes}</p>}
                </div>
            )}
        </div>
    );
}
