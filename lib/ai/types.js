// /lib/ai/types.js
// Definizione del formato dei piani settimanali (in JavaScript)

export const createMeal = (id, title, kcal, macros, gi, recipeId) => ({
    id,
    title,
    kcal,
    macros,
    gi,
    recipeId,
});

export const createWorkout = (id, title, estTime, focus, templateId) => ({
    id,
    title,
    estTime,
    focus,
    templateId,
});

export const createDayPlan = (date, meals, workout, notes = "") => ({
    date,
    meals,
    workout,
    notes,
});

export const createWeeklyPlan = (userId, weekStart, kCalTarget, macroTarget, days) => ({
    userId,
    weekStart,
    kCalTarget,
    macroTarget,
    days,
});

// 🔹 Esempio pratico di struttura vuota:
export const emptyWeeklyPlan = (userId) => ({
    userId,
    weekStart: new Date().toISOString().split("T")[0],
    kCalTarget: 2000,
    macroTarget: { c: 0.5, p: 0.3, f: 0.2 },
    days: Array.from({ length: 7 }).map((_, i) => ({
        date: new Date(Date.now() + i * 86400000).toISOString().split("T")[0],
        meals: {
            breakfast: createMeal(`b-${i}`, "Colazione", 400, { c: 0.45, p: 0.35, f: 0.2 }),
            lunch: createMeal(`l-${i}`, "Pranzo", 600, { c: 0.5, p: 0.3, f: 0.2 }),
        },
        workout: createWorkout(`w-${i}`, "Allenamento 30′", 30, ["full_body"]),
    })),
});
