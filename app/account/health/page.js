// app/account/health/page.js
"use client";

import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/ai/supabaseClient";

/* ---------------- UI atoms ---------------- */
function Section({ title, subtitle, children }) {
    return (
        <section className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-7 shadow-lg">
            <div className="mb-5">
                <h2 className="text-lg font-semibold text-white">{title}</h2>
                {subtitle && <p className="text-sm text-white/60 mt-1">{subtitle}</p>}
            </div>
            {children}
        </section>
    );
}
function Label({ htmlFor, children }) {
    return (
        <label htmlFor={htmlFor} className="block text-sm font-medium text-white/90 mb-1.5">
            {children}
        </label>
    );
}
function Input({ id, className = "", ...props }) {
    return (
        <input
            id={id}
            className={`w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${className}`}
            {...props}
        />
    );
}
function Select({ id, className = "", children, ...props }) {
    return (
        <select
            id={id}
            className={`w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 ${className}`}
            {...props}
        >
            {children}
        </select>
    );
}
function Chip({ active, onClick, children }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`px-3 py-1.5 rounded-full text-sm border transition
        ${active ? "bg-emerald-500 text-white border-emerald-500"
                    : "bg-white/5 text-white/80 border-white/15 hover:bg-white/10"}`}
        >
            {children}
        </button>
    );
}
function Button({ variant = "primary", className = "", ...props }) {
    const base =
        "px-4 py-2 rounded-lg text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-emerald-500/60";
    const styles = {
        primary: "bg-emerald-600 hover:bg-emerald-700 text-white",
        ghost: "bg-white/10 hover:bg-white/20 text-gray-100",
        subtle: "bg-white/5 hover:bg-white/10 text-white/90 border border-white/10",
        danger: "bg-red-600 hover:bg-red-700 text-white",
    };
    return <button className={`${base} ${styles[variant]} ${className}`} {...props} />;
}

/* --------------- PAGE --------------- */
export default function AccountHealthPage() {
    const sb = supabaseClient();
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    const [profile, setProfile] = useState({});
    const [diet, setDiet] = useState({});
    const [metrics, setMetrics] = useState({});
    const [goals, setGoals] = useState([]);
    const [allergies, setAllergies] = useState([]);
    const [workouts, setWorkouts] = useState([]);
    const [recipes, setRecipes] = useState([]);

    async function loadAll() {
        setLoading(true);
        setErr("");
        try {
            const { data: { user } } = await sb.auth.getUser();
            if (!user) throw new Error("Non sei autenticato.");

            const [
                { data: p },
                { data: d },
                { data: m },
                { data: g },
                { data: a },
                { data: w },
                { data: r },
            ] = await Promise.all([
                sb.from("profiles").select("*").eq("id", user.id).maybeSingle(),
                sb.from("diet_settings").select("*").eq("user_id", user.id).maybeSingle(),
                sb.from("health_metrics").select("*").eq("user_id", user.id).order("updated_at", { ascending: false }).maybeSingle(),
                sb.from("goals").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
                sb.from("allergies").select("*").eq("user_id", user.id).order("created_at", { ascending: true }),
                sb.from("workouts").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
                sb.from("saved_recipes").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
            ]);

            setProfile(p || {});
            setDiet(d || {});
            setMetrics(m || {});
            setGoals(g || []);
            setAllergies(a || []);
            setWorkouts(w || []);
            setRecipes(r || []);
        } catch (e) {
            setErr(e.message || "Errore");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function upsertProfile(partial) {
        const { data: { user } } = await sb.auth.getUser();
        const row = { id: user.id, ...profile, ...partial };
        const { error } = await sb.from("profiles").upsert(row, { onConflict: "id" });
        if (error) throw error;
        setProfile(row);
    }

    async function upsertDiet(partial) {
        const { data: { user } } = await sb.auth.getUser();
        const row = { user_id: user.id, ...diet, ...partial };
        const { error } = await sb.from("diet_settings").upsert(row, { onConflict: "user_id" });
        if (error) throw error;
        setDiet(row);
    }

    async function upsertMetrics(partial) {
        const { data: { user } } = await sb.auth.getUser();
        const row = { user_id: user.id, ...metrics, ...partial };
        const { error } = await sb.from("health_metrics").upsert(row);
        if (error) throw error;
        setMetrics(row);
    }

    async function addGoal(goalRow) {
        const { data: { user } } = await sb.auth.getUser();
        const { data, error } = await sb.from("goals").insert([{ user_id: user.id, ...goalRow }]).select().single();
        if (error) throw error;
        setGoals([data, ...goals]);
    }

    async function addAllergy(name, severity = 3) {
        const { data: { user } } = await sb.auth.getUser();
        const { data, error } = await sb.from("allergies").insert([{ user_id: user.id, name, severity }]).select().single();
        if (error) throw error;
        setAllergies([...(allergies || []), data]);
    }
    async function delAllergy(id) {
        const { error } = await sb.from("allergies").delete().eq("id", id);
        if (error) throw error;
        setAllergies((allergies || []).filter((x) => x.id !== id));
    }

    async function addWorkout(workout) {
        const { data: { user } } = await sb.auth.getUser();
        const { data, error } = await sb.from("workouts").insert([{ user_id: user.id, ...workout }]).select().single();
        if (error) throw error;
        setWorkouts([data, ...workouts]);
    }

    async function addRecipe(recipe) {
        const { data: { user } } = await sb.auth.getUser();
        const { data, error } = await sb.from("saved_recipes").insert([{ user_id: user.id, ...recipe }]).select().single();
        if (error) throw error;
        setRecipes([data, ...recipes]);
    }

    // helper: macro sum check
    const macroSum =
        (diet.macro_carbs_pct || 0) + (diet.macro_protein_pct || 0) + (diet.macro_fat_pct || 0);
    const macroOk = macroSum === 0 || macroSum === 100;

    async function saveAll() {
        // salva i tre blocchi; se uno fallisce, l’errore viene mostrato in alto
        try {
            setErr("");
            await upsertProfile({});
            await upsertDiet({});
            await upsertMetrics({});
        } catch (e) {
            setErr(e.message || "Errore");
        }
    }

    if (loading) return <main className="max-w-5xl mx-auto pt-24 px-6">Caricamento…</main>;
    if (err) return <main className="max-w-5xl mx-auto pt-24 px-6 text-red-400">{err}</main>;

    return (
        <main className="relative min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black text-white">
            {/* bg accents */}
            <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute top-[-10%] left-[5%] h-64 w-64 bg-emerald-500/25 blur-3xl rounded-full" />
                <div className="absolute bottom-[0%] right-[10%] h-64 w-64 bg-sky-500/15 blur-3xl rounded-full" />
            </div>

            <div className="max-w-5xl mx-auto px-6 py-16 md:py-20">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">
                        Dati personali per piani alimentari e allenamenti
                    </h1>
                    <p className="text-white/60 mt-2 text-sm">
                        Usa dati precisi: aiutano l’AI a personalizzare piani e ricette.
                    </p>
                </header>

                <div className="grid gap-6">
                    {/* PROFILO */}
                    <Section title="Profilo" subtitle="Dati essenziali">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <Label htmlFor="full_name">Nome completo</Label>
                                <Input
                                    id="full_name"
                                    placeholder="Mario Rossi"
                                    value={profile.full_name || ""}
                                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="birth_date">Data di nascita</Label>
                                <Input
                                    id="birth_date"
                                    type="date"
                                    value={profile.birth_date || ""}
                                    onChange={(e) => setProfile({ ...profile, birth_date: e.target.value })}
                                />
                            </div>

                            <div>
                                <Label htmlFor="sex">Sesso</Label>
                                <Select
                                    id="sex"
                                    value={profile.sex || ""}
                                    onChange={(e) => setProfile({ ...profile, sex: e.target.value || null })}
                                >
                                    <option value="">— seleziona —</option>
                                    <option value="male">Maschio</option>
                                    <option value="female">Femmina</option>
                                    <option value="other">Altro</option>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="unit">Unità di misura</Label>
                                <Select
                                    id="unit"
                                    value={profile.unit || "metric"}
                                    onChange={(e) => setProfile({ ...profile, unit: e.target.value })}
                                >
                                    <option value="metric">Metrico (kg, cm)</option>
                                    <option value="imperial">Imperiale (lb, in)</option>
                                </Select>
                            </div>
                        </div>
                        <Button className="mt-4" onClick={() => upsertProfile({})}>Salva profilo</Button>
                    </Section>

                    {/* DIETA */}
                    <Section title="Preferenze dieta" subtitle="Macro, pasti e restrizioni">
                        <div className="grid gap-4 md:grid-cols-3">
                            <div>
                                <Label htmlFor="kcal">Kcal/giorno</Label>
                                <Input
                                    id="kcal"
                                    type="number"
                                    placeholder="2000"
                                    value={diet.calories_target || ""}
                                    onChange={(e) => setDiet({ ...diet, calories_target: e.target.valueAsNumber || null })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="carb">% Carbo</Label>
                                <Input
                                    id="carb"
                                    type="number"
                                    placeholder="50"
                                    value={diet.macro_carbs_pct ?? ""}
                                    onChange={(e) => setDiet({ ...diet, macro_carbs_pct: e.target.valueAsNumber || null })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="prot">% Proteine</Label>
                                <Input
                                    id="prot"
                                    type="number"
                                    placeholder="30"
                                    value={diet.macro_protein_pct ?? ""}
                                    onChange={(e) => setDiet({ ...diet, macro_protein_pct: e.target.valueAsNumber || null })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="fat">% Grassi</Label>
                                <Input
                                    id="fat"
                                    type="number"
                                    placeholder="20"
                                    value={diet.macro_fat_pct ?? ""}
                                    onChange={(e) => setDiet({ ...diet, macro_fat_pct: e.target.valueAsNumber || null })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="meals">Pasti/giorno</Label>
                                <Select
                                    id="meals"
                                    value={diet.meals_per_day || ""}
                                    onChange={(e) => setDiet({ ...diet, meals_per_day: e.target.valueAsNumber || null })}
                                >
                                    <option value="">— seleziona —</option>
                                    {["2", "3", "4", "5", "6"].map((n) => (
                                        <option key={n} value={Number(n)}>{n}</option>
                                    ))}
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="diet_pref">Stile</Label>
                                <Select
                                    id="diet_pref"
                                    value={diet.diet_pref || ""}
                                    onChange={(e) => setDiet({ ...diet, diet_pref: e.target.value || null })}
                                >
                                    <option value="">— seleziona —</option>
                                    <option value="balanced">Bilanciata</option>
                                    <option value="mediterranean">Mediterranea</option>
                                    <option value="keto">Keto</option>
                                    <option value="low_carb">Low carb</option>
                                    <option value="low_fodmap">Low-FODMAP</option>
                                    <option value="vegetarian">Vegetariana</option>
                                    <option value="vegan">Vegana</option>
                                    <option value="paleo">Paleo</option>
                                </Select>
                            </div>
                        </div>

                        <p className={`mt-2 text-xs ${macroOk ? "text-white/50" : "text-red-400"}`}>
                            {macroOk
                                ? "Suggerimento: la somma % dovrebbe essere 100."
                                : `La somma attuale è ${macroSum}%. Correggi per arrivare a 100%.`}
                        </p>

                        <div className="mt-5">
                            <Label>Preferenze / restrizioni</Label>
                            <div className="flex flex-wrap gap-2">
                                <Chip active={!!diet.low_gi} onClick={() => setDiet({ ...diet, low_gi: !diet.low_gi })}>Basso indice glicemico</Chip>
                                <Chip active={!!diet.lactose_free} onClick={() => setDiet({ ...diet, lactose_free: !diet.lactose_free })}>Senza lattosio</Chip>
                                <Chip active={!!diet.gluten_free} onClick={() => setDiet({ ...diet, gluten_free: !diet.gluten_free })}>Senza glutine</Chip>
                            </div>
                        </div>

                        <Label htmlFor="notes" className="mt-5 block" />
                        <textarea
                            id="notes"
                            className="w-full mt-4 rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            rows={3}
                            placeholder="Note (gusti, cibi non graditi, orari, ecc.)"
                            value={diet.notes || ""}
                            onChange={(e) => setDiet({ ...diet, notes: e.target.value })}
                        />
                        <Button className="mt-4" onClick={() => upsertDiet({})} disabled={!macroOk}>
                            Salva preferenze dieta
                        </Button>
                    </Section>

                    {/* METRICHE SALUTE */}
                    <Section title="Metriche salute" subtitle="Usate per fabbisogno e workout">
                        <div className="grid gap-4 md:grid-cols-3">
                            <div>
                                <Label htmlFor="height_cm">Altezza (cm)</Label>
                                <Input
                                    id="height_cm"
                                    type="number"
                                    step="0.1"
                                    placeholder="180"
                                    value={metrics.height_cm ?? ""}
                                    onChange={(e) => setMetrics({ ...metrics, height_cm: e.target.valueAsNumber || null })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="weight_kg">Peso (kg)</Label>
                                <Input
                                    id="weight_kg"
                                    type="number"
                                    step="0.1"
                                    placeholder="72"
                                    value={metrics.weight_kg ?? ""}
                                    onChange={(e) => setMetrics({ ...metrics, weight_kg: e.target.valueAsNumber || null })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="bodyfat_pct">% Massa grassa</Label>
                                <Input
                                    id="bodyfat_pct"
                                    type="number"
                                    step="0.1"
                                    placeholder="15"
                                    value={metrics.bodyfat_pct ?? ""}
                                    onChange={(e) => setMetrics({ ...metrics, bodyfat_pct: e.target.valueAsNumber || null })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="activity">Attività</Label>
                                <Select
                                    id="activity"
                                    value={metrics.activity || ""}
                                    onChange={(e) => setMetrics({ ...metrics, activity: e.target.value || null })}
                                >
                                    <option value="">— seleziona —</option>
                                    <option value="sedentary">Sedentario</option>
                                    <option value="light">Leggera</option>
                                    <option value="moderate">Moderata</option>
                                    <option value="active">Attiva</option>
                                    <option value="athlete">Atleta</option>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="resting_hr">HR a riposo</Label>
                                <Input
                                    id="resting_hr"
                                    type="number"
                                    placeholder="60"
                                    value={metrics.resting_hr ?? ""}
                                    onChange={(e) => setMetrics({ ...metrics, resting_hr: e.target.valueAsNumber || null })}
                                />
                            </div>
                        </div>
                        <Button className="mt-4" onClick={() => upsertMetrics({})}>Salva metriche</Button>
                    </Section>

                    {/* OBIETTIVI */}
                    <Section title="Obiettivi">
                        <GoalForm onAdd={addGoal} />
                        <ul className="mt-3 space-y-2">
                            {goals.map((g) => (
                                <li key={g.id} className="text-sm opacity-90">
                                    <strong>{g.goal}</strong>{" "}
                                    {g.target_weight_kg ? `→ ${g.target_weight_kg} kg` : ""}{" "}
                                    {g.target_date ? `entro ${g.target_date}` : ""} {g.notes ? `– ${g.notes}` : ""}
                                </li>
                            ))}
                        </ul>
                    </Section>

                    {/* ALLERGIE */}
                    <Section title="Allergie / Intolleranze">
                        <AllergyForm onAdd={addAllergy} />
                        <div className="mt-3 flex flex-wrap gap-2">
                            {(allergies || []).map((a) => (
                                <span
                                    key={a.id}
                                    className="px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-200 text-sm"
                                >
                                    {a.name} (sev {a.severity})
                                    <button className="ml-2 underline" onClick={() => delAllergy(a.id)}>rimuovi</button>
                                </span>
                            ))}
                        </div>
                    </Section>

                    {/* ALLENAMENTI */}
                    <Section title="Allenamenti personalizzati">
                        <WorkoutForm onAdd={addWorkout} />
                        <ul className="mt-3 space-y-3">
                            {workouts.length === 0 && (
                                <li className="text-sm opacity-60">Nessun allenamento salvato</li>
                            )}
                            {workouts.map((w) => (
                                <WorkoutItem key={w.id} w={w} />
                            ))}
                        </ul>
                    </Section>

                    {/* RICETTE SALVATE */}
                    <Section title="Ricette salvate">
                        <RecipeForm onAdd={addRecipe} />
                        <ul className="mt-3 space-y-2">
                            {recipes.map((r) => (
                                <li key={r.id} className="text-sm opacity-90 border-b border-white/10 pb-2 mb-2">
                                    <strong>{r.title}</strong>
                                    {r.kcal ? ` – ${r.kcal} kcal` : ""}
                                    {r.tags?.length ? ` – ${r.tags.join(", ")}` : ""}

                                    {Array.isArray(r.ingredients) && (
                                        <ul className="mt-1 text-xs opacity-80 list-disc list-inside">
                                            {r.ingredients.map((i, idx) => (
                                                <li key={idx}>
                                                    {i.name} {i.qty}{i.unit && ` ${i.unit}`}
                                                </li>
                                            ))}
                                        </ul>
                                    )}

                                    {Array.isArray(r.steps) && (
                                        <ol className="mt-1 text-xs opacity-70 list-decimal list-inside">
                                            {r.steps.map((s, idx) => (
                                                <li key={idx}>{s}</li>
                                            ))}
                                        </ol>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </Section>

                    {/* CONSENSO DATI SALUTE */}
                    <Section title="Consenso trattamento dati salute">
                        <ConsentToggle />
                    </Section>
                </div>
            </div>

            {/* ACTION BAR STICKY */}
            <div className="sticky bottom-4">
                <div className="mx-auto max-w-5xl px-6">
                    <div className="rounded-2xl bg-white/10 backdrop-blur border border-white/15 p-3 flex items-center justify-between shadow-lg">
                        <span className="text-sm text-white/80">
                            {macroOk ? "Ricorda di salvare le modifiche" : `Macro al ${macroSum}%. Correggi per arrivare a 100%.`}
                        </span>
                        <div className="flex gap-2">
                            <Button variant="ghost" onClick={loadAll}>Annulla</Button>
                            <Button onClick={saveAll} disabled={!macroOk}>Salva tutto</Button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

/* ---------- SUBCOMPONENTS (logica invariata) ---------- */
function GoalForm({ onAdd }) {
    const [goal, setGoal] = useState("fat_loss");
    const [weight, setWeight] = useState("");
    const [date, setDate] = useState("");
    const [notes, setNotes] = useState("");

    return (
        <div className="grid gap-3 sm:grid-cols-4">
            <Select value={goal} onChange={(e) => setGoal(e.target.value)}>
                <option value="fat_loss">Dimagrimento</option>
                <option value="muscle_gain">Massa</option>
                <option value="maintenance">Mantenimento</option>
                <option value="recomposition">Ricomp.</option>
                <option value="performance">Prestazione</option>
            </Select>
            <Input
                placeholder="Target peso (kg)"
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
            />
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <div className="flex gap-2">
                <Input
                    className="flex-1"
                    placeholder="Note"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                />
                <Button
                    onClick={() =>
                        onAdd({
                            goal,
                            target_weight_kg: weight ? Number(weight) : null,
                            target_date: date || null,
                            notes: notes || null,
                        })
                    }
                >
                    Aggiungi
                </Button>
            </div>
        </div>
    );
}

function AllergyForm({ onAdd }) {
    const [name, setName] = useState("");
    const [sev, setSev] = useState(3);
    return (
        <div className="flex gap-2">
            <Input
                placeholder="Allergia/intolleranza (es. lattosio)"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
            <Input
                className="w-28"
                type="number"
                min={1}
                max={5}
                value={sev}
                onChange={(e) => setSev(e.target.valueAsNumber || 3)}
            />
            <Button
                onClick={() => {
                    if (name.trim()) onAdd(name.trim(), sev);
                    setName("");
                }}
            >
                Aggiungi
            </Button>
        </div>
    );
}

function WorkoutForm({ onAdd }) {
    const [name, setName] = useState("");
    const [focus, setFocus] = useState("");
    const [blocks, setBlocks] = useState(
        `[{"exercise":"Squat","sets":4,"reps":"6-8","rir":2,"rest_sec":150}]`
    );

    return (
        <div className="grid gap-2">
            <div className="grid gap-2 sm:grid-cols-3">
                <Input
                    placeholder="Nome (es. Upper A)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <Input
                    placeholder="Focus (es. hypertrophy, legs)"
                    value={focus}
                    onChange={(e) => setFocus(e.target.value)}
                />
                <Input
                    placeholder="Blocchi (JSON)"
                    value={blocks}
                    onChange={(e) => setBlocks(e.target.value)}
                />
            </div>
            <Button
                className="w-fit"
                onClick={() => {
                    let parsed = null;
                    try { parsed = JSON.parse(blocks); } catch { }
                    onAdd({
                        name,
                        focus: focus ? focus.split(",").map((s) => s.trim()).filter(Boolean) : [],
                        blocks: parsed,
                    });
                    setName("");
                    setFocus("");
                    setBlocks("[]");
                }}
            >
                Salva allenamento
            </Button>
        </div>
    );
}

function WorkoutItem({ w }) {
    const focus = Array.isArray(w.focus)
        ? w.focus
        : typeof w.focus === "string"
            ? w.focus.split(",").map((s) => s.trim()).filter(Boolean)
            : [];

    const blocks = Array.isArray(w.blocks)
        ? w.blocks
        : typeof w.blocks === "string"
            ? (() => { try { return JSON.parse(w.blocks); } catch { return []; } })()
            : [];

    return (
        <li className="rounded-xl border border-white/10 p-4 bg-white/5">
            <div className="flex items-center justify-between gap-3">
                <div className="font-medium text-emerald-400">
                    {w.name || "Allenamento"}
                </div>
                <div className="flex flex-wrap gap-1">
                    {focus.map((f, i) => (
                        <span
                            key={i}
                            className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                        >
                            {f}
                        </span>
                    ))}
                </div>
            </div>

            {blocks.length > 0 && (
                <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                        <thead className="text-left opacity-60 border-b border-white/10">
                            <tr>
                                <th className="py-1 pr-2">Esercizio</th>
                                <th className="py-1 pr-2">Serie</th>
                                <th className="py-1 pr-2">Ripetizioni</th>
                                <th className="py-1 pr-2">RIR</th>
                                <th className="py-1 pr-2">Recupero</th>
                            </tr>
                        </thead>
                        <tbody className="opacity-90">
                            {blocks.map((b, i) => (
                                <tr key={i} className="border-t border-white/5">
                                    <td className="py-1 pr-2">{b.exercise || "-"}</td>
                                    <td className="py-1 pr-2">{b.sets ?? "-"}</td>
                                    <td className="py-1 pr-2">{b.reps ?? "-"}</td>
                                    <td className="py-1 pr-2">{b.rir ?? "-"}</td>
                                    <td className="py-1 pr-2">{b.rest_sec ? `${b.rest_sec}s` : "-"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {blocks.length === 0 && (
                <p className="text-sm opacity-70 mt-2">Nessun esercizio specificato.</p>
            )}
        </li>
    );
}

function RecipeForm({ onAdd }) {
    const [title, setTitle] = useState("");
    const [kcal, setKcal] = useState("");
    const [tags, setTags] = useState("colazione, low-gi");
    const [ingredients, setIngredients] = useState(
        `[{"name":"Fiocchi d'avena","qty":60,"unit":"g"},{"name":"Albume","qty":200,"unit":"ml"}]`
    );
    const [steps, setSteps] = useState(`["Mescola","Cuoci in padella 3-4 min"]`);

    return (
        <div className="grid gap-2">
            <div className="grid gap-2 sm:grid-cols-2">
                <Input
                    placeholder="Titolo ricetta"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
                <Input
                    placeholder="Kcal"
                    type="number"
                    value={kcal}
                    onChange={(e) => setKcal(e.target.value)}
                />
            </div>
            <Input
                placeholder="Tag (comma)"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
            />
            <textarea
                className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                rows={2}
                placeholder="Ingredienti (JSON)"
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
            />
            <textarea
                className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                rows={2}
                placeholder="Passi (JSON array di stringhe)"
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
            />
            <Button
                className="w-fit"
                onClick={() => {
                    let ing = null, st = null;
                    try { ing = JSON.parse(ingredients); } catch { }
                    try { st = JSON.parse(steps); } catch { }
                    onAdd({
                        title,
                        source: "User",
                        kcal: kcal ? Number(kcal) : null,
                        protein_g: null,
                        carbs_g: null,
                        fat_g: null,
                        tags: tags ? tags.split(",").map((s) => s.trim()).filter(Boolean) : [],
                        ingredients: ing,
                        steps: st,
                    });
                    setTitle("");
                    setKcal("");
                    setTags("");
                    setIngredients("[]");
                    setSteps("[]");
                }}
            >
                Salva ricetta
            </Button>
        </div>
    );
}

/** --- CONSENT TOGGLE --- */
function ConsentToggle() {
    const sb = supabaseClient();
    const [checked, setChecked] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState("");

    useEffect(() => {
        (async () => {
            const { data: { user } } = await sb.auth.getUser();
            if (!user) { setLoading(false); return; }
            const { data } = await sb.from("user_consents").select("health_data").eq("user_id", user.id).maybeSingle();
            setChecked(!!data?.health_data);
            setLoading(false);
        })();
    }, [sb]);

    async function save() {
        setSaving(true);
        setMsg("");
        try {
            const { data: { user } } = await sb.auth.getUser();
            await sb.from("user_consents").upsert({ user_id: user.id, health_data: checked });
            setMsg("Preferenza aggiornata.");
        } catch (e) {
            setMsg(e.message || "Errore salvataggio consenso");
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <p>Caricamento…</p>;

    return (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <label className="flex items-center gap-2">
                <input
                    className="accent-emerald-600"
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => setChecked(e.target.checked)}
                />
                <span>Acconsento al trattamento dei miei dati relativi alla salute.</span>
            </label>
            <Button onClick={save} disabled={saving}>
                {saving ? "Salvataggio…" : "Salva"}
            </Button>
            {msg && <span className="text-sm opacity-80">{msg}</span>}
        </div>
    );
}
