// app/privacy/page.jsx
export const metadata = {
  title: "Privacy Policy — Get Healthy",
  description: "Informativa sulla privacy di Get Healthy S.r.l.",
};

function formatDateIT(d = new Date()) {
  try {
    return new Intl.DateTimeFormat("it-IT", { dateStyle: "long" }).format(d);
  } catch {
    return d.toLocaleDateString("it-IT");
  }
}

export default function PrivacyPage() {
  return (
    <div className="container py-12 prose prose-slate dark:prose-invert max-w-3xl">
      <h1>Privacy Policy</h1>
      <p>
        <strong>Ultimo aggiornamento:</strong> {formatDateIT()}
      </p>

      <h2>1) Chi siamo</h2>
      <p>
        <strong>Get Healthy S.r.l.</strong> (“Get Healthy”, “noi”) offre un servizio
        che aiuta gli utenti a mangiare sano e a organizzare allenamenti
        personalizzati con l’ausilio dell’AI.
      </p>

      <h2>2) Categorie di dati trattati</h2>
      <ul>
        <li>
          <strong>Dati account</strong>: email, nome (se fornito), impostazioni piano e
          consumo token/limiti.
        </li>
        <li>
          <strong>Dati per personalizzazione salute/fitness (facoltativi)</strong>:
          altezza, peso, % massa grassa, livello di attività, preferenze dieta
          (kcal target, macro, pasti/giorno, stile dieta), allergie/intolleranze,
          obiettivi, ricette/meal plan salvati, allenamenti e sessioni.
        </li>
        <li>
          <strong>Dati di utilizzo del servizio</strong>: messaggi in chat, cronologia
          richieste, log tecnici e metriche aggregate.
        </li>
      </ul>

      <h2>3) Finalità e base giuridica</h2>
      <ul>
        <li>
          <strong>Personalizzazione piani alimentari e allenamenti</strong>:
          <em>consenso</em> (art. 6(1)(a) GDPR) e, per i dati relativi alla salute,
          <em>art. 9(2)(a)</em>.
        </li>
        <li>
          <strong>Esecuzione del contratto</strong> (gestione account, piani, pagamenti se presenti):
          art. 6(1)(b) GDPR.
        </li>
        <li>
          <strong>Sicurezza/antifrode e diagnostica</strong>: legittimo interesse
          (art. 6(1)(f) GDPR).
        </li>
        <li>
          <strong>Marketing facoltativo</strong> (se attivato): consenso separato
          (art. 6(1)(a) GDPR).
        </li>
      </ul>

      <h2>4) Modalità del trattamento</h2>
      <ul>
        <li>
          Conservazione su infrastrutture <strong>Supabase</strong> (PostgreSQL) in UE/SEE quando possibile;
          backup e log secondo le policy del fornitore.
        </li>
        <li>
          <strong>Row Level Security (RLS)</strong> e controlli di accesso per limitare i dati
          al solo utente autenticato.
        </li>
        <li>
          I dati relativi alla salute sono utilizzati <em>solo</em> per le finalità di
          personalizzazione richieste dall’utente.
        </li>
      </ul>

      <h2>5) Conservazione</h2>
      <ul>
        <li>
          <strong>Dati account</strong>: finché l’account è attivo.
        </li>
        <li>
          <strong>Dati salute/fitness</strong>: finché perdura il <em>consenso</em>;
          se revocato, l’uso per personalizzazione cessa e, su richiesta, i dati
          vengono cancellati.
        </li>
        <li>
          <strong>Log e metadati tecnici</strong>: per il tempo strettamente necessario
          a sicurezza e diagnosi.
        </li>
      </ul>

      <h2>6) Destinatari / fornitori</h2>
      <ul>
        <li>
          <strong>Supabase</strong> (autenticazione, database, storage).
        </li>
        <li>
          <strong>Hosting</strong> (es. Vercel) per l’erogazione dell’applicazione.
        </li>
        <li>
          <strong>Provider AI</strong> (Google/Gemini) limitatamente alle richieste
          dell’utente. I dati relativi alla salute sono condivisi solo per fornire
          il servizio e nei limiti della richiesta (pseudonimizzati quando possibile).
        </li>
        <li>
          <strong>Reti di affiliazione</strong> (es. Awin, Impact) per il tracciamento
          delle conversioni dei link affiliati.
        </li>
      </ul>

      <h2>7) Affiliazioni & Cookie</h2>
      <p>
        Get Healthy partecipa a programmi di affiliazione con piattaforme di delivery
        e brand alimentari (es. Deliveroo, Glovo, Just Eat). Potremmo ricevere una
        piccola commissione quando effettui ordini/acquisti tramite link affiliati.
        Il prezzo per l’utente finale non cambia.
      </p>
      <p>
        Alcuni link possono impostare <strong>cookie</strong> o parametri di tracking
        forniti dai network di affiliazione (es. Awin, Impact). Questi cookie servono
        esclusivamente per attribuire correttamente le conversioni e non raccolgono
        dati personali identificabili. Puoi gestire o cancellare i cookie dalle
        impostazioni del browser.
      </p>

      <h2>8) Trasferimenti extra-SEE</h2>
      <p>
        Qualora alcuni fornitori trattino dati al di fuori dello Spazio Economico Europeo,
        adottiamo adeguate garanzie (es. Clausole Contrattuali Standard) ove richiesto
        dalla normativa applicabile.
      </p>

      <h2>9) Diritti dell’interessato</h2>
      <ul>
        <li>Accesso, rettifica, cancellazione, portabilità, limitazione e opposizione.</li>
        <li>Revoca del consenso in qualsiasi momento senza pregiudicare la liceità del trattamento precedente.</li>
        <li>
          Come esercitare: dall’area personale{" "}
          <a href="/account/data">/account/data</a> (export JSON e cancellazione account)
          oppure via email a <a href="mailto:info@gethealthy.it">info@gethealthy.it</a>.
        </li>
        <li>
          Diritto di reclamo all’Autorità Garante competente.
        </li>
      </ul>

      <h2>10) Sicurezza</h2>
      <p>
        Applichiamo misure tecniche e organizzative adeguate per proteggere i dati da
        accessi non autorizzati, perdita, uso improprio o divulgazione.
      </p>

      <h2>11) Minori</h2>
      <p>
        Il servizio non è destinato a minori di 16 anni. Se ritieni che un minore ci abbia
        fornito dati personali, contattaci per la rimozione.
      </p>

      <h2>12) Modifiche</h2>
      <p>
        Potremmo aggiornare questa informativa. Le modifiche saranno pubblicate su questa pagina
        con data di aggiornamento.
      </p>

      <h2>13) Titolare e contatti</h2>
      <p>
        <strong>Get Healthy S.r.l.</strong> — Milano (Italia) <br />
        Email: <a href="mailto:info@gethealthy.it">info@gethealthy.it</a>
      </p>
    </div>
  );
}
