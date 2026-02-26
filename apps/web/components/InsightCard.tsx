interface InsightCardProps {
  icon: string;
  value: string;
  label: string;
  description: string;
}

export function InsightCard({ icon, value, label, description }: InsightCardProps) {
  return (
    <div className="insight-card">
      <div className="insight-icon">{icon}</div>
      <div className="insight-value">{value}</div>
      <div className="insight-label">{label}</div>
      <div className="insight-desc">{description}</div>
    </div>
  );
}
