import { riskClassFor } from "@/lib/risk-colormap";

export function RiskBadge({ value }: Readonly<{ value: number }>) {
  const { badgeColor, label } = riskClassFor(value);
  return (
    <span
      className="inline-flex items-center rounded-sm px-1.5 py-0.5 text-xs font-medium uppercase text-white"
      style={{ backgroundColor: badgeColor }}
    >
      {label}
    </span>
  );
}
