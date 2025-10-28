import { Suspense } from 'react';
import SuccessClient from './SuccessClient';

// imposta la pagina come dinamica (no prerender)
export const dynamic = 'force-dynamic';

export default function Page({ searchParams }) {
    // passiamo i searchParams dal server al client component
    return (
        <main>
            <Suspense fallback={<div style={{ textAlign: 'center', padding: '3rem' }}>Caricamento…</div>}>
                <SuccessClient searchParams={searchParams} />
            </Suspense>
        </main>
    );
}

