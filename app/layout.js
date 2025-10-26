import "./../styles/globals.css";
import Footer from "../components/Footer";
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
  twitter: { card: "summary_large_image", title: "Get Healthy", description: "Mangia sano, con la tua AI personale." }
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body>
        <div className="min-h-screen flex flex-col">
          <main className="flex-1 pb-24">{children}</main>
          <Footer />
        </div>
        <NavBar />
      </body>
    </html>
  );
}
