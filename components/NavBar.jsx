export default function NavBar() {
  const items = [
    { href: "/", label: "Home" },
    { href: "#features", label: "Ricette" },
    { href: "#start", label: "Inizia" },
  ];
  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <ul className="flex gap-2 bg-white/90 backdrop-blur border border-slate-200 rounded-2xl shadow-lg px-3 py-2">
        {items.map((it) => (
          <li key={it.label}>
            <a href={it.href} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100">
              {it.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
