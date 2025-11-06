// app/ai/AIHomeButtons.jsx
"use client";
import { useEffect, useState } from "react";

export default function AIHomeButtons() {
  const [plan, setPlan] = useState("base");

  useEffect(() => {
    const p = localStorage.getItem("gh_plan") || "base";
    setPlan(p);
  }, []);

  if (plan === "base") return null;

  return (
    <div className="flex gap-3 mt-4 mb-3">
      <a
        href="/api/plan/export/pdf"
        className="px-3 py-1.5 rounded-lg border hover:bg-gray-50 transition"
      >
        📄 Scarica PDF
      </a>
      <a
        href="/api/plan/export/csv"
        className="px-3 py-1.5 rounded-lg border hover:bg-gray-50 transition"
      >
        📊 Scarica CSV
      </a>
    </div>
  );
}
