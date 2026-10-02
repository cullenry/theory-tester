import type { CSSProperties } from "react";

type CompletionScoreGaugeProps = {
  percentage: number;
  label: string;
  className?: string;
  style?: CSSProperties;
};

export function CompletionScoreGauge({ percentage, label, className = "", style }: CompletionScoreGaugeProps) {
  const score = Number.isFinite(percentage) ? Math.min(100, Math.max(0, Math.round(percentage))) : 0;

  return (
    <div
      className={`readiness-gauge completion-score-gauge${className ? ` ${className}` : ""}`}
      role="img"
      aria-label={`${label}: ${score}%`}
      style={style}
    >
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle className="readiness-gauge-track" cx="50" cy="50" r="43" />
        <circle
          className="readiness-gauge-progress"
          cx="50"
          cy="50"
          r="43"
          style={{ strokeDashoffset: 270.18 * (1 - score / 100) }}
        />
      </svg>
      <span>{score}<small>%</small></span>
    </div>
  );
}