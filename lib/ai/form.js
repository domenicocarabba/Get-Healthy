export function validateMacros({ carbs = 0, protein = 0, fat = 0 }) {
    const sum = [carbs, protein, fat].map(Number).reduce((a, b) => a + (isFinite(b) ? b : 0), 0);
    return { sum, ok: sum === 100 };
}

export function kcalFromMacros({ carbs_g = 0, protein_g = 0, fat_g = 0 }) {
    const k = (Number(carbs_g) || 0) * 4 + (Number(protein_g) || 0) * 4 + (Number(fat_g) || 0) * 9;
    return Math.round(k);
}
