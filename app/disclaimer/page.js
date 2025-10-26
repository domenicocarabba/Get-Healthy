// app/disclaimer/page.js
export const metadata = {
    title: "Disclaimer | Get Healthy",
    description:
        "Informazioni importanti: Get Healthy non sostituisce il parere medico. Consigli a scopo informativo/educativo basati su preferenze personali.",
};

export default function DisclaimerPage() {
    return (
        <main className="container mx-auto max-w-3xl px-4 py-10">
            <h1 className="text-3xl font-semibold mb-6">Disclaimer</h1>

            <div className="prose prose-invert prose-p:leading-relaxed text-gray-300">
                <p>
                    Get Healthy fornisce contenuti, suggerimenti e strumenti a scopo
                    <strong> informativo ed educativo</strong>, basati su preferenze
                    personali, gusti e stili di vita indicati dagli utenti.
                </p>

                <h2>1. Nessuna sostituzione del parere medico</h2>
                <p>
                    Le informazioni presenti sulla piattaforma non sostituiscono in alcun
                    modo il consulto, la diagnosi o il trattamento di un{" "}
                    <strong>medico, nutrizionista o altro professionista sanitario</strong>.
                    Prima di modificare dieta, integrazioni o attività fisica, consulta un
                    professionista qualificato.
                </p>

                <h2>2. Emergenze e condizioni mediche</h2>
                <p>
                    In caso di <strong>emergenza medica</strong> contatta immediatamente i
                    servizi di emergenza. In presenza di condizioni mediche esistenti,
                    intolleranze o allergie, <strong>parla con il tuo medico</strong> prima
                    di seguire qualsiasi suggerimento.
                </p>

                <h2>3. Idoneità fisica e rischi</h2>
                <p>
                    Qualsiasi attività fisica comporta rischi. Valuta la tua{" "}
                    <strong>idoneità</strong> con un professionista e interrompi
                    l’esercizio se avverti dolore, capogiri o altri sintomi.
                </p>

                <h2>4. Allergie e intolleranze</h2>
                <p>
                    L’utente è responsabile di <strong>verificare ingredienti</strong> e
                    possibili contaminazioni. I suggerimenti non garantiscono l’assenza di
                    allergeni.
                </p>

                <h2>5. Accuratezza dei contenuti</h2>
                <p>
                    Nonostante l’impegno per fornire informazioni accurate e aggiornate,
                    non garantiamo completezza, assenza di errori o idoneità per scopi
                    specifici. I contenuti generati dall’AI possono richiedere{" "}
                    <strong>verifica umana</strong>.
                </p>

                <h2>6. Dati e privacy</h2>
                <p>
                    Il trattamento dei dati personali avviene secondo la nostra{" "}
                    <a href="/privacy" className="underline">Privacy Policy</a>.
                </p>

                <h2>7. Limitazione di responsabilità</h2>
                <p>
                    Get Healthy e i suoi collaboratori non sono responsabili per eventuali
                    danni diretti o indiretti derivanti dall’uso dei contenuti o dei
                    suggerimenti forniti dalla piattaforma.
                </p>

                <h2>8. Modifiche</h2>
                <p>
                    Ci riserviamo il diritto di aggiornare questo Disclaimer. Le modifiche
                    diventano effettive al momento della pubblicazione su questa pagina.
                </p>

                <hr />

                <p className="text-sm text-gray-400">
                    Per domande:{" "}
                    <a href="mailto:get@healthy.it" className="underline">get@healthy.it</a>
                </p>
            </div>
        </main>
    );
}
