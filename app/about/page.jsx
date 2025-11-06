export const metadata = {
    title: "Chi siamo – Get Healthy AI",
    description:
        "Scopri chi c'è dietro Get Healthy AI: un team di studenti che vuole rivoluzionare il modo di mangiare e vivere in modo sano grazie all’intelligenza artificiale.",
};

export default function AboutPage() {
    return (
        <main className="max-w-4xl mx-auto px-6 pt-24 pb-16 prose prose-emerald dark:prose-invert">
            <h1 className="text-4xl font-bold text-emerald-700 mb-6">Chi siamo</h1>

            <p className="text-gray-700 leading-relaxed">
                <strong>Get Healthy AI</strong> nasce dall’idea di un piccolo gruppo di studenti
                che credono che l’intelligenza artificiale possa diventare un alleato concreto per vivere meglio.
                La nostra missione è rendere il benessere <strong>più accessibile, personalizzato e sostenibile</strong>.
            </p>

            <h2 className="text-2xl font-semibold text-emerald-700 mt-10 mb-3">
                La nostra visione
            </h2>
            <p>
                Mangiare sano, allenarsi e mantenere uno stile di vita equilibrato non deve essere complicato.
                Vogliamo offrire un’esperienza semplice e motivante, dove la tecnologia aiuta — non sostituisce —
                le scelte consapevoli di ogni giorno.
            </p>

            <h2 className="text-2xl font-semibold text-emerald-700 mt-10 mb-3">
                Cosa facciamo
            </h2>
            <ul className="list-disc pl-6">
                <li>
                    Creiamo <strong>piani alimentari intelligenti</strong> adattati ai tuoi gusti,
                    obiettivi e vincoli nutrizionali.
                </li>
                <li>
                    Offriamo <strong>ricette sane e veloci</strong> con ingredienti ottimizzati e macro bilanciate.
                </li>
                <li>
                    Suggeriamo <strong>allenamenti personalizzati</strong> in base al livello e al tempo disponibile.
                </li>
                <li>
                    Ti connettiamo a <strong>partner e servizi locali</strong> per spesa smart e consegne.
                </li>
            </ul>

            <h2 className="text-2xl font-semibold text-emerald-700 mt-10 mb-3">
                Perché Get Healthy è diversa
            </h2>
            <p>
                A differenza delle AI generiche, la nostra è una <strong>AI specializzata nel benessere</strong>,
                addestrata per comprendere abitudini, alimentazione e fitness.
                Grazie al <strong>machine learning</strong> e al feedback degli utenti, migliora costantemente,
                diventando ogni settimana più precisa, empatica e utile.
            </p>

            <blockquote className="border-l-4 border-emerald-500 pl-4 italic text-gray-600">
                “Non vogliamo fare un’altra AI.
                Vogliamo creare la tua AI personale per vivere meglio.”
            </blockquote>

            <h2 className="text-2xl font-semibold text-emerald-700 mt-10 mb-3">
                Chi c’è dietro
            </h2>
            <p>
                Siamo un <strong>team di studenti universitari</strong> appassionati di tecnologia, alimentazione e sport.
                Crediamo che l’innovazione debba essere al servizio delle persone e non l’inverso.
                Ogni riga di codice, ogni ricetta e ogni piano nasce da questa convinzione.
            </p>

            <h2 className="text-2xl font-semibold text-emerald-700 mt-10 mb-3">
                Il nostro impegno
            </h2>
            <p>
                Tutti i dati vengono trattati con il massimo rispetto della privacy,
                in conformità con il <strong>GDPR</strong> e con un approccio <em>privacy by design</em>.
                La fiducia è il primo ingrediente di una relazione sana con chi ci sceglie.
            </p>

            <p className="mt-10 text-emerald-700 font-medium">
                <em>Get Healthy AI — la tua AI personale per vivere meglio, ogni giorno.</em>
            </p>
        </main>
    );
}
