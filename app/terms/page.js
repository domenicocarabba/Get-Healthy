export const metadata = {
  title: "Termini e Condizioni d’Uso – Get Healthy",
  description: "Condizioni di utilizzo della piattaforma Get Healthy AI",
};

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 prose prose-emerald dark:prose-invert">
      <h1>Termini e Condizioni d’Uso</h1>

      <h2>1. Oggetto</h2>
      <p>
        I presenti Termini regolano l’uso della piattaforma <strong>Get Healthy AI</strong>,
        di proprietà di <strong>Get Healthy S.r.l.</strong>, Milano, Italia.
      </p>

      <h2>2. Registrazione e account</h2>
      <p>
        L’utente deve registrarsi fornendo dati veritieri ed è responsabile della riservatezza
        delle proprie credenziali di accesso e di ogni attività svolta tramite il proprio account.
      </p>
      <p>
        Get Healthy S.r.l. si riserva il diritto di sospendere o chiudere account che violino
        le regole d’uso, i presenti termini o le leggi vigenti.
      </p>

      <h2>3. Servizi offerti</h2>
      <p>
        La piattaforma offre piani di intelligenza artificiale che generano:
      </p>
      <ul>
        <li>Suggerimenti nutrizionali e piani alimentari personalizzati.</li>
        <li>Programmi di attività fisica e benessere personalizzati.</li>
      </ul>
      <p>
        I servizi non costituiscono in alcun modo consulenza medica o nutrizionale professionale,
        ma hanno finalità esclusivamente informative e di benessere generale.
      </p>

      <h2>4. Piani e abbonamenti</h2>
      <p>
        Sono disponibili diversi piani di accesso (<strong>Base</strong>, <strong>Plus</strong>,
        <strong>Pro</strong>), che offrono differenti livelli di funzionalità e assistenza AI.
      </p>
      <p>
        Il pagamento avviene tramite fornitori terzi (es. Stripe) e le condizioni di disdetta,
        rinnovo o rimborso sono specificate nella sezione “Piani” al momento dell’acquisto.
      </p>

      <h2>5. Proprietà intellettuale</h2>
      <p>
        Tutti i contenuti, loghi, testi, design e materiali presenti su Get Healthy AI sono
        di proprietà esclusiva di Get Healthy S.r.l. o dei rispettivi titolari dei diritti.
      </p>
      <p>
        È vietata qualsiasi riproduzione, distribuzione o utilizzo non autorizzato dei contenuti
        senza il consenso scritto del titolare.
      </p>

      <h2>6. Limitazione di responsabilità</h2>
      <p>
        Get Healthy S.r.l. non è responsabile per eventuali danni diretti o indiretti derivanti da:
      </p>
      <ul>
        <li>uso improprio della piattaforma o dei suoi contenuti;</li>
        <li>interpretazioni errate dei suggerimenti generati dall’intelligenza artificiale;</li>
        <li>malfunzionamenti tecnici non imputabili al titolare.</li>
      </ul>

      <h2>7. Legge applicabile</h2>
      <p>
        I presenti Termini sono disciplinati dalla <strong>legge italiana</strong>.
        Per qualsiasi controversia è competente in via esclusiva il <strong>Foro di Milano</strong>.
      </p>

      <p className="mt-8 italic text-sm text-gray-500">
        Ultimo aggiornamento: Novembre 2025
      </p>
    </main>
  );
}
