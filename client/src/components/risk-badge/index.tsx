import { riskClassFor } from "@/lib/risk-colormap";

export function RiskBadge({ value }: { value: number }) {
  const { color, label, textColor } = riskClassFor(value);
  return (
    <span
      className={`inline-flex items-center rounded-sm px-1.5 py-0.5 text-xs font-medium ${textColor}`}
      style={{ backgroundColor: color }}
    >
      {label}
    </span>
  );
}
