// app/partners/page.js
import PartnerCard from "../../components/PartnerCard";
import { partners } from "../../data/partners";

export const metadata = {
    title: "Partner & Affiliazioni – Get Healthy",
    description:
        "Servizi e brand selezionati per ordinare cibo sano e ingredienti. Alcuni link sono di affiliazione.",
};

export default function PartnersPage() {
    return (
        <main className="container mx-auto px-4 py-10">
            <h1 className="text-3xl md:text-4xl font-bold text-white">
                Partner & Affiliazioni
            </h1>

            <p className="mt-3 text-gray-300 max-w-2xl">
                Collaboriamo con servizi selezionati per rendere più semplice mangiare sano.
                Quando acquisti o ordini tramite i nostri link, potremmo ricevere una piccola
                commissione. Il prezzo per te non cambia.
            </p>

            <div className="mt-4 rounded-xl border border-gray-800 bg-black/40 p-4 text-sm text-gray-300">
                <strong>Trasparenza:</strong> alcuni link sono di affiliazione. Non forniamo
                consigli medici; i contenuti sono informativi e basati su gusti e obiettivi personali.
                Per condizioni cliniche rivolgiti al tuo medico.
            </div>

            <section className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {partners.map((p) => (
                    <PartnerCard key={p.id} {...p} />
                ))}
            </section>
        </main>
    );
}
