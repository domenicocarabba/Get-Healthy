// /lib/export.js
import jsPDF from "jspdf";

/* =========================
   CSV helpers
   ========================= */

/** Crea header = unione delle chiavi presenti in tutte le righe */
function collectHeader(rows) {
    const keys = new Set();
    for (const r of rows) Object.keys(r || {}).forEach((k) => keys.add(k));
    return Array.from(keys);
}

/** Escapa in modo sicuro i campi CSV (virgolette, virgole, newline) */
function csvEscape(value) {
    const s = String(value ?? "");
    const needsQuotes = /[",\n]/.test(s);
    const escaped = s.replace(/"/g, '""');
    return needsQuotes ? `"${escaped}"` : escaped;
}

/** Converte un array di oggetti in CSV e forza il download */
export function exportCSV(rows, filename = "export.csv") {
    if (!Array.isArray(rows) || rows.length === 0) {
        console.warn("exportCSV: nessuna riga da esportare");
        return;
    }
    const header = collectHeader(rows);
    const lines = [
        header.join(","),
        ...rows.map((r) => header.map((k) => csvEscape(r[k])).join(",")),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

/** Estrae righe CSV dalla shopping list del piano */
export function shoppingListRows(plan) {
    return (plan?.shopping_list || []).map((x) => ({
        Item: x.item,
        Qty: x.qty ?? "",
        Unit: x.unit ?? "",
    }));
}

/* =========================
   PDF helpers (jsPDF)
   ========================= */

/** Aggiunge testo con word-wrap e gestione page-break */
function addWrappedText(doc, text, x, y, maxWidth = 174, lineHeight = 5) {
    const parts = doc.splitTextToSize(String(text ?? ""), maxWidth);
    for (const line of parts) {
        doc.text(line, x, y);
        y += lineHeight;
        if (y > 280) {
            doc.addPage();
            y = 18;
        }
    }
    return y;
}

/** Esporta un piano settimanale (JSON) in PDF leggibile */
export function exportPlanPDF(plan, filename = "piano_settimanale.pdf") {
    const doc = new jsPDF();
    let y = 18;

    doc.setFontSize(16);
    doc.setFont(undefined, "bold");
    doc.text("Piano alimentare", 14, y);
    doc.setFont(undefined, "normal");
    y += 8;
    doc.setFontSize(10);

    // Giorni e pasti
    for (const d of plan?.days || []) {
        doc.setFont(undefined, "bold");
        doc.text(
            `Giorno ${d.day} — Totale: ${d?.total_macros?.kcal ?? "-"} kcal`,
            14,
            y
        );
        doc.setFont(undefined, "normal");
        y += 6;

        for (const m of d?.meals || []) {
            // Riga pasto
            doc.text(`• ${m.name} — ${m?.macros?.kcal ?? "-"} kcal`, 18, y);
            y += 6;
            // Ricetta (wrap)
            if (m.recipe) {
                y = addWrappedText(doc, m.recipe, 22, y, 174, 5);
                y += 2;
            }
            if (y > 280) {
                doc.addPage();
                y = 18;
            }
        }

        y += 2;
        if (y > 280) {
            doc.addPage();
            y = 18;
        }
    }

    // Lista della spesa
    doc.addPage();
    y = 18;
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text("Lista della spesa", 14, y);
    doc.setFont(undefined, "normal");
    y += 8;
    doc.setFontSize(10);

    for (const it of plan?.shopping_list || []) {
        y = addWrappedText(
            doc,
            `• ${it.item} — ${it.qty ?? ""} ${it.unit ?? ""}`.trim(),
            14,
            y,
            174,
            6
        );
    }

    doc.save(filename);
}

/** Esporta una singola ricetta (JSON) in PDF compatto */
export function exportRecipePDF(recipe, filename = "ricetta.pdf") {
    const doc = new jsPDF();
    let y = 18;

    doc.setFontSize(16);
    doc.setFont(undefined, "bold");
    doc.text(String(recipe?.name || "Ricetta"), 14, y);
    doc.setFont(undefined, "normal");
    y += 8;

    doc.setFontSize(10);
    const meta = [
        `Porzioni: ${recipe?.servings ?? "-"}`,
        `Prep: ${recipe?.prep_minutes ?? "-"}'`,
        `Cottura: ${recipe?.cook_minutes ?? "-"}'`,
    ].join(" · ");
    doc.text(meta, 14, y);
    y += 6;

    if (recipe?.macros) {
        doc.text(
            `Macro: ${recipe.macros.kcal ?? "-"} kcal · ${recipe.macros.protein_g ?? "-"}g pro · ${recipe.macros.carbs_g ?? "-"}g carb · ${recipe.macros.fat_g ?? "-"}g fat`,
            14,
            y
        );
        y += 6;
    }

    // Ingredienti
    doc.setFont(undefined, "bold");
    doc.text("Ingredienti", 14, y);
    doc.setFont(undefined, "normal");
    y += 6;

    for (const ing of recipe?.ingredients || []) {
        y = addWrappedText(
            doc,
            `• ${ing.qty ?? ""} ${ing.unit ?? ""} ${ing.item ?? ""}`.replace(/\s+/g, " ").trim(),
            14,
            y,
            174,
            5
        );
        if (y > 280) { doc.addPage(); y = 18; }
    }

    // Procedimento
    y += 2;
    doc.setFont(undefined, "bold");
    doc.text("Procedimento", 14, y);
    doc.setFont(undefined, "normal");
    y += 6;

    (recipe?.steps || []).forEach((s, i) => {
        y = addWrappedText(doc, `${i + 1}. ${s}`, 14, y, 174, 5);
        if (y > 280) { doc.addPage(); y = 18; }
    });

    if (recipe?.notes) {
        y += 2;
        doc.setFont(undefined, "bold");
        doc.text("Note", 14, y);
        doc.setFont(undefined, "normal");
        y += 6;
        y = addWrappedText(doc, recipe.notes, 14, y, 174, 5);
    }

    doc.save(filename);
}
