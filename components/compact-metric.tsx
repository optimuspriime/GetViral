import { formatCompactNumber, formatExactNumber } from "@/lib/format";

export function CompactMetric({
  value,
  suffix,
  className = "",
}: {
  value: number;
  suffix?: string;
  className?: string;
}) {
  const compact = formatCompactNumber(value);
  const exact = formatExactNumber(value);
  const fullLabel = suffix ? `${exact} ${suffix}` : exact;

  return (
    <span
      className={`tabular-nums ${className}`.trim()}
      title={fullLabel}
      aria-label={fullLabel}
    >
      {compact}
    </span>
  );
}
