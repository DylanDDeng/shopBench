interface MetricCardProps {
  value: string;
  label: string;
  color?: string;
  note?: string;
  tone?: "neutral" | "positive" | "negative" | "accent";
}

export function MetricCard({
  value,
  label,
  color,
  note,
  tone = "neutral",
}: MetricCardProps) {
  return (
    <div className={`metric-card metric-card-${tone}`}>
      <div className="metric-label">{label}</div>
      <div className="metric-value" style={color ? { color } : undefined}>
        {value}
      </div>
      {note ? <div className="metric-note">{note}</div> : null}
    </div>
  );
}
