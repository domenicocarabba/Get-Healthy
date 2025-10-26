export const metadata = {
  title: "Terms of Service — Get Healthy",
  description: "Termini di servizio di Get Healthy."
};

export default function TermsPage() {
  return (
    <div className="container py-12 prose prose-slate max-w-3xl">
      <h1>Termini di Servizio</h1>
      <p><strong>Ultimo aggiornamento:</strong> {new Date().toLocaleDateString()}</p>
      <h2>1. Accettazione</h2>
      <p>L'uso del sito implica accettazione dei presenti termini.</p>
      <h2>2. Uso del servizio</h2>
      <ul>
        <li>Niente usi illeciti o dannosi</li>
        <li>Nessun tentativo di accesso non autorizzato</li>
      </ul>
      <h2>3. Contenuti e accuratezza</h2>
      <p>I contenuti generati dall’AI hanno scopo informativo e non sostituiscono pareri medici.</p>
      <h2>4. Proprietà intellettuale</h2>
      <p>Codice, contenuti e brand “Get Healthy” sono protetti.</p>
      <h2>5. Limitazione di responsabilità</h2>
      <p>Servizio fornito “così com’è”; esclusa responsabilità per danni indiretti nei limiti di legge.</p>
      <h2>6. Cessazione</h2>
      <p>Possiamo sospendere l’accesso in caso di violazioni.</p>
      <h2>7. Legge applicabile</h2>
      <p>Legge italiana; foro competente Milano.</p>
      <h2>8. Contatti</h2>
      <p><a href="mailto:get@gethealthy.it">get@gethealthy.it</a></p>
    </div>
  );
}
