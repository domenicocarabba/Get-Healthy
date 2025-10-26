export const metadata = {
  title: "Privacy Policy — Get Healthy",
  description: "Informativa sulla privacy di Get Healthy."
};

export default function PrivacyPage() {
  return (
    <div className="container py-12 prose prose-slate max-w-3xl">
      <h1>Privacy Policy</h1>
      <p><strong>Ultimo aggiornamento:</strong> {new Date().toLocaleDateString()}</p>

      <h2>1. Chi siamo</h2>
      <p><strong>Get Healthy</strong> aiuta gli utenti a mangiare sano con l'AI.</p>

      <h2>2. Dati raccolti</h2>
      <ul>
        <li>Email</li>
        <li>Preferenze alimentari e obiettivi (se forniti)</li>
        <li>Dati tecnici anonimi (log, metriche aggregate)</li>
      </ul>

      <h2>3. Uso</h2>
      <ul>
        <li>Personalizzazione piani/ricette</li>
        <li>Comunicazioni sulla beta</li>
        <li>Miglioramento del servizio</li>
      </ul>

      <h2>4. Conservazione</h2>
      <p>Per il tempo necessario al servizio o fino a richiesta di cancellazione.</p>

      <h2>5. Condivisione</h2>
      <p>Nessuna vendita dei dati. Fornitori terzi conformi al GDPR.</p>

      <h2>6. Diritti</h2>
      <p>
        Accesso, rettifica, cancellazione, opposizione, portabilità.
        Contatti: <a href="mailto:get@gethealthy.it">get@gethealthy.it</a>
      </p>

      <h2>7. Sicurezza</h2>
      <p>Misure tecniche e organizzative ragionevoli.</p>

      <h2>8. Minori</h2>
      <p>Non destinato a minori di 16 anni.</p>

      <h2>9. Modifiche</h2>
      <p>Aggiornamenti pubblicati su questa pagina.</p>

      {/* 🟢 SEZIONE NUOVA */}
      <h2>10. Affiliazioni & Cookie</h2>
      <p>
        Get Healthy partecipa a programmi di affiliazione con piattaforme di delivery e brand
        alimentari (es. Deliveroo, Glovo, Just Eat). Questi programmi consentono di ricevere
        una piccola commissione quando un utente effettua un ordine o acquisto tramite un link
        affiliato presente sul sito. Il prezzo per l’utente finale non cambia.
      </p>
      <p>
        Alcuni link possono impostare cookie o parametri di tracciamento forniti dai network
        di affiliazione (es. Awin, Impact). Questi cookie servono esclusivamente per attribuire
        correttamente le conversioni e non raccolgono dati personali identificabili.
        È possibile gestire o cancellare i cookie tramite le impostazioni del browser.
      </p>
    </div>
  );
}

