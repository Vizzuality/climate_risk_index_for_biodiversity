import { riskClassFor } from "@/lib/risk-colormap";
import { cn } from "@/lib/utils";

export function RiskBadge({
  value,
  className = "",
}: Readonly<{ value: number; className?: string }>) {
  const { color, label, textColor } = riskClassFor(value);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-1.5 py-0.5 text-xs font-medium",
        textColor,
        className,
      )}
      style={{ backgroundColor: color }}
    >
      {label}
    </span>
  );
}
