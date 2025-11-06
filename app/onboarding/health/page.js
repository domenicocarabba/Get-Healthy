// app/onboarding/health/page.js
"use client";

// @ts-nocheck  // (opz.) evita warning TS su file .js
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/ai/supabaseClient";

const Step = ({ title, children }) => (
    <section className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
        <h2 className="text-lg font-semibold mb-3">{title}</h2>
        {children}
    </section>
);

export default function OnboardingHealth() {
    const sb = supabaseClient();
    const router = useRouter();

    const [u, setU] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState("");

    // Dati base
    const [full_name, setName] = useState("");
    const [birth_date, setBirth] = useState("");
    const [sex, setSex] = useState("");
    const [unit, setUnit] = useState("metric");

    // Metriche minime
    const [height_cm, setH] = useState("");
    const [weight_kg, setW] = useState("");
    const [activity, setAct] = useState("");

    // Dieta minime
    const [kcal, setKcal] = useState("");
    const [meals, setMeals] = useState(4);
    const [diet_pref, setDiet] = useState("");

    // Consenso
    const [consentHealth, setConsentHealth] = useState(false);

    // --- Load user + prefill if existing ---
    useEffect(() => {
        (async () => {
            const { data: { user } } = await sb.auth.getUser();
            if (!user) { router.replace("/login"); return; }
            setU(user);

            // Prefill da Supabase se ci sono dati
            const [
                { data: prof },
                { data: metrics },
                { data: diet },
                { data: consent },
            ] = await Promise.all([
                sb.from("profiles").select("*").eq("id", user.id).maybeSingle(),
                sb.from("health_metrics").select("*").eq("user_id", user.id).order("updated_at", { ascending: false }).maybeSingle(),
                sb.from("diet_settings").select("*").eq("user_id", user.id).maybeSingle(),
                sb.from("user_consents").select("health_data").eq("user_id", user.id).maybeSingle(),
            ]);

            if (prof) {
                setName(prof.full_name || "");
                setBirth(prof.birth_date || "");
                setSex(prof.sex || "");
                setUnit(prof.unit || "metric");
            }
            if (metrics) {
                setH(metrics.height_cm ?? "");
                setW(metrics.weight_kg ?? "");
                setAct(metrics.activity || "");
            }
            if (diet) {
                setKcal(diet.calories_target ?? "");
                setMeals(diet.meals_per_day ?? 4);
                setDiet(diet.diet_pref || "");
            }
            if (typeof consent?.health_data === "boolean") {
                setConsentHealth(!!consent.health_data);
            }

            setLoading(false);
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --- Submit ---
    async function complete() {
        setErr("");

        // mini-validazione: richiedi minimi che il middleware usa
        if (!height_cm || !weight_kg || !activity || !meals) {
            setErr("Per procedere indica almeno: altezza, peso, livello attività e pasti/giorno.");
            return;
        }
        if (!consentHealth) {
            setErr("Per usare la personalizzazione devi acconsentire al trattamento dei dati salute.");
            return;
        }

        try {
            setSaving(true);

            // 1) profilo
            await sb.from("profiles").upsert({
                id: u.id,
                full_name,
                birth_date: birth_date || null,
                sex: sex || null,
                unit,
            });

            // 2) metriche
            await sb.from("health_metrics").upsert({
                user_id: u.id,
                height_cm: height_cm ? Number(height_cm) : null,
                weight_kg: weight_kg ? Number(weight_kg) : null,
                activity: activity || null,
            });

            // 3) dieta minime
            await sb.from("diet_settings").upsert({
                user_id: u.id,
                calories_target: kcal ? Number(kcal) : null,
                meals_per_day: meals ? Number(meals) : null,
                diet_pref: diet_pref || null,
            });

            // 4) consenso
            await sb.from("user_consents").upsert({
                user_id: u.id,
                health_data: !!consentHealth,
            });

            // Done → vai all'AI
            router.replace("/ai");
        } catch (e) {
            setErr(e.message || "Errore");
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return <main className="max-w-2xl mx-auto pt-24 px-6">Caricamento…</main>;
    }

    return (
        <main className="max-w-2xl mx-auto pt-24 px-6">
            <h1 className="text-2xl font-semibold mb-5">Onboarding: personalizza la tua AI</h1>

            <Step title="1) Informazioni base">
                <div className="grid gap-3 sm:grid-cols-2">
                    <input className="input" placeholder="Nome e cognome" value={full_name} onChange={e => setName(e.target.value)} />
                    <input className="input" type="date" value={birth_date} onChange={e => setBirth(e.target.value)} />
                    <select className="input" value={sex} onChange={e => setSex(e.target.value)}>
                        <option value="">— sesso —</option>
                        <option value="male">Maschio</option>
                        <option value="female">Femmina</option>
                        <option value="other">Altro</option>
                    </select>
                    <select className="input" value={unit} onChange={e => setUnit(e.target.value)}>
                        <option value="metric">Metrico</option>
                        <option value="imperial">Imperiale</option>
                    </select>
                </div>
            </Step>

            <Step title="2) Dati fisici minimi">
                <div className="grid gap-3 sm:grid-cols-3">
                    <input className="input" placeholder="Altezza (cm)" type="number" value={height_cm} onChange={e => setH(e.target.value)} />
                    <input className="input" placeholder="Peso (kg)" type="number" value={weight_kg} onChange={e => setW(e.target.value)} />
                    <select className="input" value={activity} onChange={e => setAct(e.target.value)}>
                        <option value="">— attività —</option>
                        <option value="sedentary">Sedentario</option>
                        <option value="light">Leggero</option>
                        <option value="moderate">Moderato</option>
                        <option value="active">Attivo</option>
                        <option value="athlete">Atleta</option>
                    </select>
                </div>
            </Step>

            <Step title="3) Preferenze dieta minime">
                <div className="grid gap-3 sm:grid-cols-3">
                    <input className="input" placeholder="Kcal/giorno (opz.)" type="number" value={kcal} onChange={e => setKcal(e.target.value)} />
                    <input className="input" placeholder="Pasti/giorno" type="number" value={meals} onChange={e => setMeals(e.target.value)} />
                    <select className="input" value={diet_pref} onChange={e => setDiet(e.target.value)}>
                        <option value="">— stile —</option>
                        <option value="balanced">Bilanciata</option>
                        <option value="mediterranean">Mediterranea</option>
                        <option value="keto">Keto</option>
                        <option value="low_carb">Low carb</option>
                        <option value="low_fodmap">Low-FODMAP</option>
                        <option value="vegetarian">Vegetariana</option>
                        <option value="vegan">Vegana</option>
                        <option value="paleo">Paleo</option>
                    </select>
                </div>
            </Step>

            <Step title="4) Consenso">
                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={consentHealth}
                        onChange={e => setConsentHealth(e.target.checked)}
                    />
                    Acconsento al trattamento dei miei dati relativi alla salute
                    per finalità di personalizzazione dieta/allenamento.
                </label>
                <p className="text-xs opacity-70 mt-2">
                    Potrai revocare il consenso in qualsiasi momento da Account → Dati salute.
                </p>
            </Step>

            {err && <p className="text-red-400 mb-3">{err}</p>}

            <button className="btn" disabled={saving} onClick={complete}>
                {saving ? "Salvataggio…" : "Completa e vai all’AI"}
            </button>

            <style jsx>{`
        .input{background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); padding:.6rem .8rem; border-radius:.75rem}
        .btn{background:#10b981; color:#0b1321; font-weight:600; padding:.6rem 1rem; border-radius:.75rem}
      `}</style>
        </main>
    );
}
