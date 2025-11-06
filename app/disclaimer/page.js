export const metadata = {
    title: "Disclaimer – Get Healthy",
    description: "Avvertenze e limitazioni di responsabilità di Get Healthy AI.",
};

export default function DisclaimerPage() {
    return (
        <main className="max-w-3xl mx-auto px-6 py-16 prose prose-emerald dark:prose-invert">
            <h1>Disclaimer</h1>

            <p>
                Get Healthy fornisce contenuti, suggerimenti e strumenti a scopo{" "}
                <strong>informativo ed educativo</strong>, basati su preferenze personali,
                gusti e stili di vita indicati dagli utenti.
            </p>

            <h2>1. Nessuna sostituzione del parere medico</h2>
            <p>
                Le informazioni presenti sulla piattaforma non sostituiscono in alcun modo
                il consulto, la diagnosi o il trattamento di un{" "}
                <strong>medico, nutrizionista o altro professionista sanitario</strong>. Prima
                di modificare dieta, integrazioni o attività fisica, consulta un professionista qualificato.
            </p>

            <h2>2. Emergenze e condizioni mediche</h2>
            <p>
                In caso di <strong>emergenza medica</strong> contatta immediatamente i servizi
                di emergenza. In presenza di condizioni mediche esistenti, intolleranze o
                allergie, <strong>parla con il tuo medico</strong> prima di seguire qualsiasi suggerimento.
            </p>

            <h2>3. Idoneità fisica e rischi</h2>
            <p>
                Qualsiasi attività fisica comporta rischi. Valuta la tua{" "}
                <strong>idoneità</strong> con un professionista e interrompi l’esercizio se
                avverti dolore, capogiri o altri sintomi.
            </p>

            <h2>4. Allergie e intolleranze</h2>
            <p>
                L’utente è responsabile di <strong>verificare ingredienti</strong> e possibili
                contaminazioni. I suggerimenti dell’AI non garantiscono l’assenza di allergeni.
            </p>

            <h2>5. Accuratezza dei contenuti</h2>
            <p>
                Nonostante l’impegno per fornire informazioni accurate e aggiornate, Get Healthy
                non garantisce completezza o assenza di errori. I contenuti generati dall’AI
                possono richiedere <strong>verifica umana</strong>.
            </p>

            <h2>6. Dati e privacy</h2>
            <p>
                Il trattamento dei dati personali avviene secondo la nostra{" "}
                <a href="/privacy">Privacy Policy</a>.
            </p>

            <h2>7. Limitazione di responsabilità</h2>
            <p>
                Get Healthy e i suoi collaboratori non sono responsabili per eventuali danni
                diretti o indiretti derivanti dall’uso dei contenuti o dei servizi offerti
                dalla piattaforma.
            </p>

            <p className="mt-8 italic text-sm text-gray-500">
                Ultimo aggiornamento: Novembre 2025
            </p>
        </main>
    );
}
