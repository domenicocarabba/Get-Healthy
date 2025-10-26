// components/CookieBanner.jsx
"use client";
import { useState, useEffect } from "react";

export default function CookieBanner() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const accepted = localStorage.getItem("cookiesAccepted");
        if (!accepted) setVisible(true);
    }, []);

    const acceptCookies = () => {
        localStorage.setItem("cookiesAccepted", "true");
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-black/90 text-gray-200 p-4 text-sm z-50 border-t border-gray-700">
            <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
                <p className="leading-snug">
                    Usiamo cookie per migliorare la tua esperienza e per attività di
                    affiliazione (es. tracciamento ordini Deliveroo o Glovo). Scopri di più nella{" "}
                    <a href="/privacy" className="underline text-green-400">
                        Privacy Policy
                    </a>.
                </p>
                <button
                    onClick={acceptCookies}
                    className="bg-green-500 text-black font-semibold px-4 py-1.5 rounded hover:bg-green-400 transition"
                >
                    Accetta
                </button>
            </div>
        </div>
    );
}
