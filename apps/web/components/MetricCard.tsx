interface MetricCardProps {
  value: string;
  label: string;
  color?: string;
}

export function MetricCard({ value, label, color }: MetricCardProps) {
  return (
    <div className="metric-card">
      <div className="metric-value" style={color ? { color } : undefined}>
        {value}
      </div>
      <div className="metric-label">{label}</div>
    </div>
  );
}
