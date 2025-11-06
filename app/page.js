"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  Salad,
  ShoppingBasket,
  Sparkles,
  Apple,
  ChefHat,
  Timer,
  HeartPulse,
  Dumbbell,
  MessageCircle,
  ShieldCheck,
  RefreshCcw,
  Lock,
  Database,
  GraduationCap,
  CheckCircle2
} from "lucide-react";

// Palette coerente con il logo (verde) + accenti soft
const brand = {
  primary: "from-emerald-500 via-green-500 to-lime-500",
  ring: "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500",
};

const Feature = ({ icon: Icon, title, desc }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.5 }}
    className="group relative rounded-2xl border border-gray-200 bg-white/70 backdrop-blur p-6 shadow-sm hover:shadow-md"
  >
    <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 group-hover:bg-emerald-100">
      <Icon className="h-5 w-5 text-emerald-600" />
    </div>
    <h3 className="text-lg font-semibold">{title}</h3>
    <p className="mt-2 text-sm text-gray-600">{desc}</p>
  </motion.div>
);

const HowStep = ({ n, title, desc }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.4 }}
    className="relative rounded-2xl border border-gray-200 bg-white/70 backdrop-blur p-5"
  >
    <div className="absolute -top-3 -left-3 h-8 w-8 rounded-full bg-emerald-600 text-white grid place-items-center text-sm font-bold shadow">
      {n}
    </div>
    <h4 className="font-semibold">{title}</h4>
    <p className="mt-1 text-sm text-gray-600">{desc}</p>
  </motion.div>
);

/* Badge di fiducia riutilizzabili */
const TrustBadge = ({ icon: Icon, label, sub }) => (
  <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white/70 px-3 py-1.5 text-sm shadow-sm">
    <Icon className="h-4 w-4 text-emerald-600" />
    <span className="font-medium">{label}</span>
    {sub ? <span className="text-xs text-gray-500">· {sub}</span> : null}
  </div>
);

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* HERO */}
      <section className="relative overflow-hidden">
        {/* Gradient + blobs */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className={`absolute -top-24 left-1/2 h-[38rem] w-[38rem] -translate-x-1/2 rounded-full blur-3xl opacity-30 bg-gradient-to-br ${brand.primary}`} />
          <div className={`absolute -bottom-24 -right-20 h-[28rem] w-[28rem] rounded-full blur-3xl opacity-20 bg-gradient-to-tr ${brand.primary}`} />
        </div>

        <div className="mx-auto max-w-6xl px-6 pt-28 pb-20 text-center">
          <div className="mx-auto mb-6 flex items-center justify-center gap-3">
            <Image src="/logo.png" alt="Get Healthy logo" width={44} height={44} className="rounded-full" />
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
              <Sparkles className="h-3.5 w-3.5" /> Beta privata
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
              <RefreshCcw className="h-3.5 w-3.5" /> AI in allenamento continuo
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">
            Mangia sano, <span className="bg-gradient-to-br from-emerald-600 to-lime-600 bg-clip-text text-transparent">vivi sano</span>
            <br className="hidden sm:block" />
            con la tua AI personale
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base sm:text-lg text-gray-600">
            Piani settimanali su misura, ricette a basso indice glicemico, allenamenti personalizzati e lista della spesa smart, con link diretti per ordinare dai partner. In più una community attiva su WhatsApp/Telegram con contenuti riservati.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/ai" className={`inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-white font-medium shadow hover:bg-emerald-700 transition ${brand.ring}`}>
              Inizia ora <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link href="/plan" className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-5 py-3 font-medium text-gray-900 hover:border-gray-400 transition">
              Vedi i piani
            </Link>
          </div>

          {/* Strip fiducia */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <TrustBadge icon={ShieldCheck} label="Specializzata nel benessere" sub="non generica" />
            <TrustBadge icon={RefreshCcw} label="Migliora con l'uso" sub="apprendimento costante" />
            <TrustBadge icon={Lock} label="Privacy by design" sub="GDPR-ready" />
          </div>

          {/* Hero cards preview */}
          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-white/70 p-4 backdrop-blur text-left">
              <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50"><Bot className="h-4 w-4 text-emerald-600" /></div>
              <p className="text-sm text-gray-700"><span className="font-semibold">AI Nutrizionale</span> che capisce obiettivi, gusti, allergie e tempo.</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white/70 p-4 backdrop-blur text-left">
              <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50"><Salad className="h-4 w-4 text-emerald-600" /></div>
              <p className="text-sm text-gray-700">Ricette <span className="font-semibold">buone, sane e veloci</span> con macro e step precisi.</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white/70 p-4 backdrop-blur text-left">
              <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50"><ShoppingBasket className="h-4 w-4 text-emerald-600" /></div>
              <p className="text-sm text-gray-700">Lista spesa <span className="font-semibold">ottimizzata</span> + link per acquistare o ordinare.</p>
            </div>
          </div>
        </div>
      </section>

      {/* VALUE SECTION / BENTO */}
      <section className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <div className="rounded-3xl border border-gray-200 bg-gradient-to-br from-white to-emerald-50 p-8">
              <h2 className="text-2xl sm:text-3xl font-bold">Tutto ciò che ti serve per mangiare meglio</h2>
              <p className="mt-2 text-gray-600 max-w-2xl">Dalla pianificazione alla spesa, fino all’ordine dai partner:
                Get Healthy semplifica ogni decisione alimentare con l’aiuto dell’AI.</p>
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Feature icon={Apple} title="Piani su misura" desc="2000 kcal? Low GI? Senza lattosio? L’AI adatta il piano ai tuoi vincoli." />
                <Feature icon={ChefHat} title="Ricette smart" desc="Step chiari, tempi reali, alternative e sostituzioni intelligenti." />
                <Feature icon={Timer} title="Velocità e costanza" desc="Ricette 10/20/30 minuti e reminder per restare sul piano." />
                <Feature icon={HeartPulse} title="Benessere misurabile" desc="Macro, fibre, indice glicemico e progressi settimanali." />
                <Feature icon={Dumbbell} title="Allenamenti su misura" desc="Workout generati dall’AI e piani dei partner, adattati a livello e obiettivi." />
                <Feature icon={MessageCircle} title="Community Get Healthy" desc="WhatsApp/Telegram con consigli, news e contenuti esclusivi." />
              </div>
              <div className="mt-8">
                <Link href="/ai" className={`inline-flex items-center rounded-xl bg-emerald-600 px-4 py-2 text-white font-medium hover:bg-emerald-700 transition ${brand.ring}`}>
                  Prova subito l’AI <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-gray-200 bg-white p-6">
              <h3 className="text-lg font-semibold">Come funziona</h3>
              <div className="mt-4 space-y-4">
                <HowStep n={1} title="Rispondi a 5 domande" desc="Obiettivi, gusti, allergie, tempo disponibile." />
                <HowStep n={2} title="Ottieni il tuo piano" desc="7 giorni con pasti, macro, ricette e lista della spesa." />
                <HowStep n={3} title="Cucina o ordina" desc="Segui le ricette o ordina dai partner suggeriti." />
              </div>
            </div>
            <div className="rounded-3xl border border-gray-200 bg-gradient-to-br from-emerald-600 to-green-600 p-6 text-white">
              <h3 className="text-lg font-semibold">Pronto a partire?</h3>
              <p className="mt-1 text-emerald-50">Entra in chat e fatti guidare dalla tua AI personale.</p>
              <Link href="/ai" className="mt-4 inline-flex items-center rounded-xl bg-white/90 px-4 py-2 font-medium text-emerald-900 hover:bg-white">
                Inizia ora <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* PERCHE' LA NOSTRA AI E' DIVERSA */}
      <section className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="rounded-3xl border border-gray-200 bg-white/70 backdrop-blur p-8">
            <h2 className="text-2xl sm:text-3xl font-bold">
              🧠 La prima AI che <span className="bg-gradient-to-br from-emerald-600 to-lime-600 bg-clip-text text-transparent">impara da te</span> per farti stare meglio
            </h2>
            <p className="mt-3 text-gray-700">
              Non una semplice chat, ma un assistente che evolve con te.
              Ogni consiglio alimentare, allenamento o ricetta diventa parte del suo apprendimento,
              rendendola ogni giorno più precisa e più vicina alle tue abitudini.
            </p>

            <div className="mt-6 space-y-3">
              {[
                "Addestrata su nutrizione, fitness e abitudini sane (non su tutto).",
                "Adatta i piani ai tuoi dati e feedback (obiettivi, gusti, allergie).",
                "Linee guida e fonti autorevoli integrate nelle risposte.",
                "Aggiornamenti continui per maggiore precisione nel tempo.",
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
                  <p className="text-sm text-gray-700">{text}</p>
                </div>
              ))}
            </div>

            <p className="mt-4 text-xs text-gray-500">
              Nota: Get Healthy AI offre supporto informativo su alimentazione e benessere e non sostituisce il parere medico.
            </p>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-gradient-to-br from-white to-emerald-50 p-8">
            <h3 className="text-lg font-semibold">Cosa significa, in pratica</h3>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TrustBadge icon={ShieldCheck} label="Consigli contestuali" sub="in base al tuo piano" />
              <TrustBadge icon={Database} label="Ricette ottimizzate" sub="macro & indice glicemico" />
              <TrustBadge icon={RefreshCcw} label="Apprendimento" sub="preferenze & feedback" />
              <TrustBadge icon={Lock} label="Controllo dati" sub="profilo editabile" />
            </div>

            <Link
              href="/ai"
              className="mt-6 inline-flex items-center rounded-xl bg-emerald-600 px-4 py-2 text-white font-medium hover:bg-emerald-700 transition"
            >
              Provala sulla tua routine <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* TRAINING + COMMUNITY SECTION */}
      <section className="mx-auto max-w-6xl px-6 py-8 sm:py-12">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-gray-200 bg-white p-8">
            <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50"><Dumbbell className="h-5 w-5 text-emerald-600" /></div>
            <h3 className="text-2xl font-bold">Allenamento personalizzato</h3>
            <p className="mt-2 text-gray-600">Aggiungi i tuoi dati (livello, obiettivi, tempo a disposizione) e lasciati guidare dall’AI: ti proponiamo <strong>piani di allenamento</strong> auto-impostati e programmi selezionati dai <strong>nostri partner</strong>.</p>
            <div className="mt-4 flex gap-3">
              <Link href="/ai" className={`inline-flex items-center rounded-xl bg-emerald-600 px-4 py-2 text-white font-medium hover:bg-emerald-700 transition ${brand.ring}`}>
                Genera il tuo workout <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link href="/plan" className="inline-flex items-center rounded-xl border border-gray-300 bg-white px-4 py-2 font-medium text-gray-900 hover:border-gray-400 transition">Scopri i piani</Link>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-gradient-to-br from-emerald-600 to-green-600 p-8 text-white">
            <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/15"><MessageCircle className="h-5 w-5" /></div>
            <h3 className="text-2xl font-bold">Community Get Healthy</h3>
            <p className="mt-2 text-emerald-50">Unisciti al gruppo <strong>WhatsApp/Telegram</strong>: salute, sport, alimentazione, Q&A con esperti e contenuti riservati agli iscritti.</p>
            <Link href="/community" className="mt-4 inline-flex items-center rounded-xl bg-white/90 px-4 py-2 font-medium text-emerald-900 hover:bg-white">Unisciti ora <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="bg-gradient-to-b from-white to-emerald-50/40">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="text-center text-2xl sm:text-3xl font-bold">Risultati reali, zero sbatti</h2>
          <p className="mt-2 text-center text-gray-600 max-w-2xl mx-auto">Gli utenti ci scelgono perché elimina il carico decisionale: mangi bene, risparmi tempo e resti costante.</p>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
              <p className="text-4xl font-extrabold bg-gradient-to-br from-emerald-600 to-lime-600 bg-clip-text text-transparent">-35%</p>
              <p className="mt-1 text-sm text-gray-600">tempo speso a decidere cosa mangiare</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
              <p className="text-4xl font-extrabold bg-gradient-to-br from-emerald-600 to-lime-600 bg-clip-text text-transparent">+20%</p>
              <p className="mt-1 text-sm text-gray-600">aderenza al piano settimanale</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
              <p className="text-4xl font-extrabold bg-gradient-to-br from-emerald-600 to-lime-600 bg-clip-text text-transparent">90%</p>
              <p className="mt-1 text-sm text-gray-600">ricette pronte in meno di 20′</p>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-8 sm:p-10">
          <div className={`absolute -right-10 -top-10 h-56 w-56 rounded-full opacity-25 blur-2xl bg-gradient-to-br ${brand.primary}`} />
          <div className="relative z-10">
            <h3 className="text-2xl sm:text-3xl font-bold">Porta l’AI a tavola, ogni giorno</h3>
            <p className="mt-2 max-w-2xl text-gray-600">Prova gratis con il piano base. Potrai passare a Plus o Pro quando vuoi.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/ai" className={`inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-white font-medium shadow hover:bg-emerald-700 transition ${brand.ring}`}>
                Chatta con l’AI <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link href="/plan" className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-5 py-3 font-medium text-gray-900 hover:border-gray-400 transition">
                Scopri i piani
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
