// components/PartnerCard.jsx

export default function PartnerCard({ name, url, logo, description, tags = [] }) {
    return (
        <div className="rounded-2xl border border-gray-800 bg-black/40 p-5 hover:bg-black/50 transition">
            <div className="flex items-center gap-3">
                {logo ? (
                    <img
                        src={logo}
                        alt={name}
                        className="h-10 w-10 rounded-lg object-contain bg-white p-1"
                    />
                ) : (
                    <div className="h-10 w-10 rounded-lg bg-gray-700 flex items-center justify-center text-white font-semibold">
                        {name.charAt(0)}
                    </div>
                )}

                <div className="flex-1">
                    <h3 className="text-white font-semibold">{name}</h3>
                    <p className="text-sm text-gray-300">{description}</p>
                </div>
            </div>

            {tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                    {tags.map((t) => (
                        <span
                            key={t}
                            className="text-xs rounded-full border border-gray-700 px-2 py-0.5 text-gray-300"
                        >
                            {t}
                        </span>
                    ))}
                </div>
            )}

            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 font-medium text-black hover:bg-green-400"
            >
                Vai al partner →
            </a>
        </div>
    );
}
