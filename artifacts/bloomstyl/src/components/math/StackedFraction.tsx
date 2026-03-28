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