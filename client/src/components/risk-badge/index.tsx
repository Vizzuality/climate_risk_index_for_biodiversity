import { riskClassFor } from "@/lib/risk-colormap";

export function RiskBadge({ value }: Readonly<{ value: number }>) {
  const { badgeColor, label } = riskClassFor(value);
  return (
    <span
      className="inline-flex items-center rounded-[4px] px-2 py-0.5 text-[10px] leading-4 font-semibold uppercase tracking-[1px] whitespace-nowrap text-white"
      style={{ backgroundColor: badgeColor }}
    >
      {label}
    </span>
  );
}
