export function StackedFraction({
  numerator,
  denominator,
}: {
  numerator: number | string;
  denominator: number | string;
}) {
  return (
    <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", lineHeight: 1 }}>
      <span>{numerator}</span>
      <span style={{ borderTop: "1px solid black", width: "100%", textAlign: "center" }}>
        {denominator}
      </span>
    </span>
  );
}

/**
 * Renders a string of math text, automatically converting fraction notation
 * like "3/4" into stacked fraction visuals while leaving surrounding text intact.
 */
export function MathInlineText({ text }: { text: string }) {
  const parts = text.split(/(\d+\/\d+)/g);
  return (
    <span>
      {parts.map((part, i) => {
        const match = part.match(/^(\d+)\/(\d+)$/);
        if (match) {
          return (
            <StackedFraction key={i} numerator={match[1]} denominator={match[2]} />
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}