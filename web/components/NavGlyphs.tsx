/** Minimal inline SVGs for collapsed sidebar (20×20 viewBox) */
export function NavGlyph({ id, className = "h-5 w-5" }: { id: string; className?: string }) {
  const c = `${className} flex-shrink-0 text-current opacity-80`;
  switch (id) {
    case "dashboard":
      return (
        <svg className={c} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
        </svg>
      );
    case "locations":
      return (
        <svg className={c} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path
            fillRule="evenodd"
            d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
            clipRule="evenodd"
          />
        </svg>
      );
    case "skus":
      return (
        <svg className={c} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm0 2h12v10H4V5z" />
        </svg>
      );
    case "inventory":
      return (
        <svg className={c} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4h14v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
        </svg>
      );
    case "transfers":
      return (
        <svg className={c} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path d="M8 5a1 1 0 011-1h6a1 1 0 011 1v2h3a1 1 0 01.8 1.6L15.25 12l4.55 3.4A1 1 0 0119 17h-3v2a1 1 0 01-1 1H9a1 1 0 01-1-1v-2H5a1 1 0 01-.8-1.6L8.75 10 4.2 6.6A1 1 0 015 5h3V4z" />
        </svg>
      );
    case "orders":
      return (
        <svg className={c} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path
            fillRule="evenodd"
            d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 2h8v2H6V6zm0 4h8v2H6v-2z"
            clipRule="evenodd"
          />
        </svg>
      );
    case "planning":
      return (
        <svg className={c} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path
            fillRule="evenodd"
            d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
            clipRule="evenodd"
          />
        </svg>
      );
    case "trips":
      return (
        <svg className={c} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
          <path d="M3 4a1 1 0 00-1 1v10l2 2h2l3-6h6l1 1h2V6H9L8 4H3z" />
        </svg>
      );
    case "reports":
      return (
        <svg className={c} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
        </svg>
      );
    default:
      return (
        <svg className={c} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <circle cx="10" cy="10" r="2" />
        </svg>
      );
  }
}
