export default function Footer() {
  return (
    <footer className="w-full text-center py-10 bg-gradient-to-b from-black via-neutral-900 to-black text-gray-400 border-t border-neutral-800">
      {/* Email di contatto */}
      <p className="text-sm">
        Contatti:{" "}
        <a
          href="mailto:info@gethealthy.it"
          className="text-emerald-400 hover:underline hover:text-emerald-300 transition"
        >
          info@gethealthy.it
        </a>
      </p>

      {/* Copyright */}
      <p className="text-sm mt-2 text-gray-500">
        © {new Date().getFullYear()}{" "}
        <span className="font-medium text-white">Get Healthy</span> — Tutti i diritti riservati
      </p>

      {/* Link legali */}
      <div className="flex justify-center items-center flex-wrap gap-3 mt-4 text-xs">
        <a href="/privacy" className="hover:text-emerald-400 transition">
          Privacy Policy
        </a>
        <span className="text-gray-600">•</span>
        <a href="/terms" className="hover:text-emerald-400 transition">
          Termini d’Uso
        </a>
        <span className="text-gray-600">•</span>
        <a href="/disclaimer" className="hover:text-emerald-400 transition">
          Disclaimer
        </a>
        <span className="text-gray-600">•</span>
        <a href="/cookies" className="hover:text-emerald-400 transition">
          Cookie Policy
        </a>
      </div>

      {/* Divider */}
      <div className="w-24 h-px bg-neutral-800 mx-auto my-6"></div>

      {/* Disclaimer legale breve */}
      <p className="text-[11px] leading-relaxed text-gray-500 max-w-xl mx-auto px-4">
        Get Healthy offre consigli e suggerimenti a scopo informativo ed educativo, basati su gusti
        personali e stili di vita. I contenuti non sostituiscono il parere di medici, nutrizionisti
        o altri professionisti sanitari qualificati.
      </p>
    </footer>
  );
}
