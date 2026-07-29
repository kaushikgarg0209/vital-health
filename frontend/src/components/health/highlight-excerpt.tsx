type HighlightExcerptProps = {
  excerpt: string;
  query: string;
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function HighlightExcerpt({ excerpt, query }: HighlightExcerptProps) {
  const terms = query
    .trim()
    .split(/\s+/)
    .filter((term) => term.length > 0)
    .map((term) => term.toLowerCase());

  if (terms.length === 0) {
    return <span>{excerpt}</span>;
  }

  const pattern = new RegExp(`(${terms.map(escapeRegExp).join("|")})`, "gi");
  const parts = excerpt.split(pattern);

  return (
    <span>
      {parts.map((part, index) =>
        terms.includes(part.toLowerCase()) ? (
          <mark
            key={`${part}-${index}`}
            className="rounded-sm bg-primary-100 px-0.5 text-neutral-800"
          >
            {part}
          </mark>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        ),
      )}
    </span>
  );
}
