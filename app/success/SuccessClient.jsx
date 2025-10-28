'use client';

export default function SuccessClient({ searchParams }) {
    const plan = searchParams?.plan ?? 'base';

    return (
        <section style={{ maxWidth: 720, margin: '0 auto', padding: '3rem 1rem', textAlign: 'center' }}>
            <h1>✅ Pagamento completato</h1>
            <p>Hai attivato il piano: <strong>{plan}</strong></p>
            <a href="/" style={{ display: 'inline-block', marginTop: 24, textDecoration: 'underline' }}>
                Torna alla Home
            </a>
        </section>
    );
}
