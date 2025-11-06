import "./../styles/globals.css";
import { Suspense } from "react";
import Footer from "../components/Footer";
import CookieBanner from "../components/CookieBanner";
import Header from "../components/Header"; // ✅ il tuo nuovo header

export const metadata = {
  title: "Get Healthy",
  description: "Piani alimentari sani e ricette personalizzate con AI.",
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/favicon.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    shortcut: ["/favicon.ico"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body className="bg-white text-gray-900">
        <Suspense fallback={null}>
          {/* ✅ Header con login/logout e menu utente */}
          <Header />

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
