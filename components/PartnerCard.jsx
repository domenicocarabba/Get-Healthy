// components/PartnerCard.jsx
export default function PartnerCard({ name, url, description, logo, tags = [] }) {
    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-gray-800 bg-black/30 p-4 hover:bg-black/40"
        >
            {logo ? <img src={logo} alt={name} className="h-10 mb-3" /> : null}
            <h3 className="text-lg font-semibold text-white">{name}</h3>
            {description && <p className="text-sm text-gray-300 mt-1">{description}</p>}
            {tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-400">
                    {tags.map((t) => (
                        <span key={t} className="px-2 py-0.5 rounded-full border border-gray-700">
                            {t}
                        </span>
                    ))}
                </div>
            )}
        </a>
    );
}
