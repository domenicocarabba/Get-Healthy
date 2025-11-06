"use client";
import Link from "next/link";

export default function NavBar() {
  return (
    <nav className="fixed top-0 left-0 w-full bg-white/90 backdrop-blur-md shadow-sm z-50">
      <div className="max-w-6xl mx-auto flex justify-between items-center px-6 py-4">
        <Link href="/" className="text-xl font-semibold text-green-600">
          Get Healthy
        </Link>
        <div className="flex space-x-6 text-gray-700 font-medium">
          <Link href="/" className="hover:text-green-600 transition">Home</Link>
          <Link href="/ai" className="hover:text-green-600 transition">AI</Link>
          <Link href="/pricing" className="hover:text-green-600 transition">Piani</Link>
        </div>
      </div>
    </nav>
  );
}
