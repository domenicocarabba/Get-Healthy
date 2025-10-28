import "./../styles/globals.css";
import { Suspense } from "react";
import Footer from "../components/Footer";
import CookieBanner from "../components/CookieBanner";
import NavBar from "../components/NavBar";

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body className="bg-white text-gray-900">
        <NavBar />
        <div className="min-h-screen flex flex-col pt-20">
          <Suspense fallback={null}>
            <main className="flex-1 pb-24">{children}</main>
          </Suspense>
          <Footer />
        </div>
        <CookieBanner />
      </body>
    </html>
  );
}

