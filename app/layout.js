import "./../styles/globals.css";
import { Suspense } from "react";           // ✅ aggiunto per risolvere l’errore di useSearchParams
import Footer from "../components/Footer";
import CookieBanner from "../components/CookieBanner";
import NavBar from "../components/NavBar";

export const metadata = {
  title: "Get Healthy",
  description: "Piani alimentari sani e ricette personalizzate con AI.",
  openGraph: {
    title: "Get Healthy",
    description: "AI che ti aiuta a mangiare sano: piani, ricette, spesa o delivery.",
    url: "https://gethealthy.it",
    siteName: "Get Healthy",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Get Healthy",
    description: "Mangia sano, con la tua AI personale.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body className="bg-white text-gray-900">
        {/* ✅ Navbar in alto */}
        <NavBar />

        {/* ✅ Corpo principale del sito */}
        <div className="min-h-screen flex flex-col pt-20">
          {/* ✅ Suspense globale per evitare errori con useSearchParams */}
          <Suspense fallback={null}>
            <main className="flex-1 pb-24">{children}</main>
          </Suspense>

          <Footer />
        </div>

        {/* ✅ Cookie banner sempre visibile */}
        <CookieBanner />
      </body>
    </html>
  );
}
