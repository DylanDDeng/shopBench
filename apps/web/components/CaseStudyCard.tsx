import type { CSSProperties } from "react";
import type { Locale } from "@/lib/i18n";

interface CaseStudyProps {
  icon: string;
  title: string;
  model: string;
  narrative: string;
  stats: { label: string; value: string }[];
  accentColor?: string;
  locale?: Locale;
}

export function CaseStudyCard({ icon, title, model, narrative, stats, accentColor, locale = "en" }: CaseStudyProps) {
  const isZh = locale === "zh";
  const cardStyle = { "--case-accent": accentColor ?? "#f59e0b" } as CSSProperties;

  return (
    <div className="case-study" style={cardStyle}>
      <div className="case-study-kicker">{isZh ? "失败模式" : "Failure Pattern"}</div>
      <div className="case-study-header">
        <span className="case-study-icon">{icon}</span>
        <div>
          <div className="case-study-title">{title}</div>
          <div className="case-study-model">{model}</div>
        </div>
      </div>
      <p className="case-study-narrative">{narrative}</p>
      <div className="case-study-stats">
        {stats.map(s => (
          <div key={s.label} className="case-study-stat">
            <span className="case-study-stat-label">{s.label}</span>
            <span className="case-study-stat-value">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
