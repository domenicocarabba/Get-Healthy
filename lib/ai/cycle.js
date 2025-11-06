export function addMonths(date, months) {
    const d = new Date(date); const t = new Date(d); t.setMonth(t.getMonth() + months); return t;
}
export function isCycleExpired(cycleStart, now = new Date()) {
    if (!cycleStart) return true; return now >= addMonths(cycleStart, 1);
}
export function nextCycleEnd(cycleStart) { return cycleStart ? addMonths(cycleStart, 1) : null; }
