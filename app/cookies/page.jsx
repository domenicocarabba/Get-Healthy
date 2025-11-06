export const metadata = {
    title: "Cookie Policy – Get Healthy",
    description: "Informativa sui cookie utilizzati dalla piattaforma Get Healthy AI",
};

export default function CookiesPage() {
    return (
        <main className="max-w-3xl mx-auto px-6 py-16 prose prose-emerald dark:prose-invert">
            <h1>Cookie Policy</h1>

            <p>
                La presente informativa descrive le tipologie di cookie utilizzate dalla piattaforma{" "}
                <strong>Get Healthy AI</strong>, di proprietà di <strong>Get Healthy S.r.l.</strong>, con
                sede in Milano (Italia), e-mail:{" "}
                <a href="mailto:info@gethealthy.it">info@gethealthy.it</a>.
            </p>

            <h2>Tipologie di cookie utilizzati</h2>
            <ul>
                <li>
                    <strong>Cookie tecnici (necessari):</strong> essenziali per il corretto funzionamento
                    della piattaforma, permettono ad esempio il login, la gestione della sessione e la
                    memorizzazione delle preferenze dell’utente.
                </li>
                <li>
                    <strong>Cookie analitici anonimi:</strong> raccolgono in forma aggregata e anonima dati
                    statistici sull’utilizzo del sito (es. numero di utenti, pagine visitate, tempo medio di
                    permanenza) per migliorare le funzionalità e l’esperienza d’uso. Sono facoltativi e
                    attivati solo previo consenso dell’utente.
                </li>
                <li>
                    <strong>Cookie di terze parti:</strong> possono essere utilizzati da fornitori di servizi
                    esterni (es. Stripe per i pagamenti o Supabase per l’autenticazione). In nessun caso
                    Get Healthy utilizza cookie pubblicitari o di profilazione senza consenso esplicito.
                </li>
            </ul>

            <h2>Gestione del consenso</h2>
            <p>
                Al primo accesso, l’utente può accettare o rifiutare i cookie non necessari tramite un{" "}
                <strong>banner informativo</strong>. Le preferenze possono essere modificate in qualsiasi
                momento accedendo alle impostazioni del browser o eliminando i cookie salvati.
            </p>
            <p>
                I principali browser consentono di gestire le preferenze relative ai cookie. Di seguito i
                link alle guide ufficiali:
            </p>
            <ul>
                <li>
                    <a
                        href="https://support.google.com/chrome/answer/95647"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Google Chrome
                    </a>
                </li>
                <li>
                    <a
                        href="https://support.mozilla.org/it/kb/Attivare%20e%20disattivare%20i%20cookie"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Mozilla Firefox
                    </a>
                </li>
                <li>
                    <a
                        href="https://support.apple.com/it-it/guide/safari/sfri11471/mac"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Safari
                    </a>
                </li>
                <li>
                    <a
                        href="https://support.microsoft.com/it-it/microsoft-edge"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Microsoft Edge
                    </a>
                </li>
            </ul>

            <h2>Modifiche alla Cookie Policy</h2>
            <p>
                La presente Cookie Policy può essere aggiornata periodicamente per riflettere modifiche
                normative o evoluzioni tecniche della piattaforma. La versione più recente sarà sempre
                disponibile sul sito ufficiale.
            </p>

            <p className="mt-8 italic text-sm text-gray-500">
                Ultimo aggiornamento: Novembre 2025
            </p>
        </main>
    );
}
