export default function Footer() {
  return (
    <footer className="w-full text-center py-8 bg-black text-gray-400">
      {/* Contatto email */}
      <p className="text-sm">
        Contact:{" "}
        <a href="mailto:get@healthy.it" className="text-white hover:underline">
          get@healthy.it
        </a>
      </p>

      {/* Copyright */}
      <p className="text-sm mt-2">
        © {new Date().getFullYear()} Get Healthy — All rights reserved
      </p>

      {/* Link legali */}
      <p className="text-xs mt-4 space-x-4">
        <a href="/privacy" className="hover:underline text-gray-300">Privacy</a>
        <span>•</span>
        <a href="/terms" className="hover:underline text-gray-300">Terms</a>
        <span>•</span>
        <a href="/disclaimer" className="hover:underline text-gray-300">Disclaimer</a>
      </p>

      {/* Disclaimer legale breve */}
      <p className="text-[11px] mt-6 text-gray-500 max-w-xl mx-auto px-4">
        Get Healthy offre consigli e suggerimenti a scopo informativo ed educativo,
        basati su gusti personali e stili di vita.
        I contenuti non sostituiscono il parere di medici, nutrizionisti
        o altri professionisti sanitari qualificati.
      </p>
    </footer>
  );
}
