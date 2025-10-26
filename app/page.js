'use client';
export default function HomePage() {
  return (
    <div className="bg-hero-gradient">
      <section className="container pt-20 pb-12 text-center">
        <div className="mb-3"><span className="inline-block text-xs font-medium px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">Beta privata</span></div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Get Healthy</h1>
        <p className="mt-4 text-lg text-slate-600">Mangia sano, con la tua AI personale 🍱🤖</p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <a href="#start" className="btn btn-primary">Inizia ora</a>
          <a href="#features" className="btn btn-secondary">Scopri ricette</a>
        </div>
      </section>

      <section id="features" className="container py-12 grid md:grid-cols-3 gap-6">
        {[
          ["Piani su misura", "Preferenze, obiettivi e intolleranze: l'AI costruisce un piano per te."],
          ["Ricette smart", "Piatti facili, sani e buoni, con macro e tempi di preparazione."],
          ["Ordina o cucina", "Puoi cucinare a casa o ordinare dai partner selezionati."],
        ].map(([title, desc], i) => (
          <div key={i} className="card p-6 text-left">
            <h3 className="font-bold text-lg">{title}</h3>
            <p className="text-slate-600 mt-2">{desc}</p>
          </div>
        ))}
      </section>

      <section className="container py-12" id="start">
        <div className="card p-6">
          <h2 className="text-2xl font-bold">Come funziona</h2>
          <ol className="mt-4 space-y-2 list-decimal list-inside text-slate-700">
            <li>Rispondi a 5 domande (obiettivi, gusti, allergie).</li>
            <li>Ottieni un piano settimanale personalizzato con ricette.</li>
            <li>Scegli se cucinare o ordinare dagli shop partner.</li>
          </ol>
          <form className="mt-6 grid sm:grid-cols-[1fr_1fr_auto] gap-3" onSubmit={(e) => e.preventDefault()}>
            <input className="rounded-xl border border-slate-300 px-4 py-3" placeholder="La tua email" />
            <input className="rounded-xl border border-slate-300 px-4 py-3" placeholder="Obiettivo (dimagrire, energia…)" />
            <button className="btn btn-primary">Partecipa alla beta</button>
          </form>
          <p className="text-xs text-slate-500 mt-2">Iscrivendoti accetti la nostra privacy policy.</p>
        </div>
      </section>
    </div>
  );
}
