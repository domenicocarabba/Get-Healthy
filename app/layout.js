import "./../styles/globals.css";
import { Suspense } from "react";
import Footer from "../components/Footer";
import CookieBanner from "../components/CookieBanner";
import NavBar from "../components/NavBar";

export const metadata = {
  title: "Get Healthy",
  description: "Piani alimentari sani e ricette personalizzate con AI.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body className="bg-white text-gray-900">
        {/* ✅ Una sola Suspense che avvolge TUTTO ciò che può usare hook client */}
        <Suspense fallback={null}>
          <NavBar />
          <div className="min-h-screen flex flex-col pt-20">
            <main className="flex-1 pb-24">{children}</main>
            <Footer />
          </div>
          <CookieBanner />
        </Suspense>
      </body>
    </html>
  );
}


