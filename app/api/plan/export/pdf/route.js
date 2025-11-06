import { supabaseServer } from "@/lib/ai/supabaseServer.js";
import { normalizePlan, PLAN } from "@/lib/ai/plans.js";
import PDFDocument from "pdfkit";

export async function GET() {
  const sb = supabaseServer();
  const { data: { session } } = await sb.auth.getSession();
  if (!session?.user) return new Response("unauthorized", { status: 401 });
  const uid = session.user.id;

  const { data: prof } = await sb.from("profiles").select("*").eq("id", uid).single();
  const plan = normalizePlan(prof?.plan);
  if (!PLAN[plan].export) return new Response("export not allowed for this plan", { status: 403 });

  const { data: row } = await sb
    .from("weekly_plans")
    .select("*")
    .eq("user_id", uid)
    .order("week_start", { ascending: false })
    .limit(1).single();
  if (!row) return new Response("no plan", { status: 404 });

  const planJson = row.plan_json || row.plan || {};
  const doc = new PDFDocument({ margin: 40 });
  const chunks = [];
  doc.on("data", (c) => chunks.push(c));
  doc.on("end", () => { });

  doc.fontSize(18).text("Piano settimanale", { align: "center" });
  doc.moveDown();
  doc.fontSize(12).text(`Week start: ${row.week_start}`);

  for (const d of planJson.days || []) {
    doc.moveDown().fontSize(14).text(d.date || "Giorno");
    doc.fontSize(11);

    if (d.meals) {
      for (const k of ["breakfast", "lunch", "snack", "dinner"]) {
        const m = d.meals[k];
        if (!m) continue;
        doc.text(`• ${k}: ${m.title} (${Math.round(m.kcal || 0)} kcal)  C:${m?.macros?.c ?? "-"} P:${m?.macros?.p ?? "-"} F:${m?.macros?.f ?? "-"}`);
      }
    }
    if (d.workout) {
      doc.text(`💪 Workout: ${d.workout.title} ~${d.workout.estTime || "-"}'`);
    }
  }

  doc.end();
  const blob = Buffer.concat(chunks);
  return new Response(blob, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="weekly-plan-${row.week_start}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
