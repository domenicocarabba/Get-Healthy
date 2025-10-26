export default function Footer() {
  return (
    <footer className="w-full text-center py-8 bg-black text-gray-400">
      <p className="text-sm">
        Contact:{" "}
        <a href="mailto:get@gethealthy.it" className="text-white hover:underline">
          get@gethealthy.it
        </a>
      </p>
      <p className="text-sm mt-2">© {new Date().getFullYear()} gethealthy.it — All rights reserved</p>
      <p className="text-xs mt-4 space-x-4">
        <a href="/privacy" className="hover:underline text-gray-300">Privacy</a>
        <span>•</span>
        <a href="/terms" className="hover:underline text-gray-300">Terms</a>
      </p>
    </footer>
  );
}
