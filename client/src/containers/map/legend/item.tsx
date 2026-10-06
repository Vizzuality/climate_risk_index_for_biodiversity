import type { ReactNode } from "react";
import { LucideDroplet, LucideEye, LucideEyeOff, LucideX } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { LegendSwatch, MapLayerLegend } from "@/lib/map-layers";
import { RISK_CLASSES } from "@/lib/risk-colormap";
import { cn } from "@/lib/utils";

const ACTION_CLASS_NAME =
  "flex size-6 cursor-pointer items-center justify-center rounded-full text-slate-700 hover:bg-slate-200";

type LegendItemProps = {
  label: string;
  legend: MapLayerLegend;
  visible: boolean;
  opacity: number;
  onVisibleChange: (visible: boolean) => void;
  onOpacityChange: (percent: number) => void;
  onRemove?: () => void;
};

export function LegendItem({
  label,
  legend,
  visible,
  opacity,
  onVisibleChange,
  onOpacityChange,
  onRemove,
}: Readonly<LegendItemProps>) {
  const VisibilityIcon = visible ? LucideEye : LucideEyeOff;
  return (
    <li className="flex flex-col gap-1 bg-slate-50 py-2 pr-1 pl-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="pl-1 text-xs leading-4 font-normal tracking-[0.24px] text-slate-700">
          {label}
        </h3>
        <div className="flex items-center">
          <Popover>
            <ActionTooltip label="Opacity">
              <PopoverTrigger asChild>
                <button type="button" aria-label={`${label} opacity`} className={ACTION_CLASS_NAME}>
                  <LucideDroplet className="size-4" aria-hidden />
                </button>
              </PopoverTrigger>
            </ActionTooltip>
            <PopoverContent
              side="top"
              align="end"
              className="flex w-56 items-center gap-3 px-3 py-2"
            >
              <Slider
                aria-label={`${label} opacity`}
                min={0}
                max={100}
                step={10}
                value={[opacity]}
                onValueChange={([value]) => onOpacityChange(value)}
              />
              <output className="w-9 text-right text-xs text-slate-700">{opacity}%</output>
            </PopoverContent>
          </Popover>
          <ActionTooltip label={visible ? "Hide layer" : "Show layer"}>
            <button
              type="button"
              aria-label={`${visible ? "Hide" : "Show"} ${label}`}
              aria-pressed={!visible}
              onClick={() => onVisibleChange(!visible)}
              className={ACTION_CLASS_NAME}
            >
              <VisibilityIcon className="size-4" aria-hidden />
            </button>
          </ActionTooltip>
          {onRemove && (
            <ActionTooltip label="Remove layer">
              <button
                type="button"
                aria-label={`Remove ${label}`}
                onClick={onRemove}
                className={ACTION_CLASS_NAME}
              >
                <LucideX className="size-4" aria-hidden />
              </button>
            </ActionTooltip>
          )}
        </div>
      </div>
      {legend.type === "discrete" ? <DiscreteLegend /> : <CategoriesLegend items={legend.items} />}
    </li>
  );
}

function ActionTooltip({ label, children }: Readonly<{ label: string; children: ReactNode }>) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side="top"
        className="bg-white text-slate-600 shadow-md"
        arrowClassName="bg-white fill-white"
      >
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

function DiscreteLegend() {
  return (
    <div className="flex flex-col gap-1 px-1">
      <div className="flex h-2" aria-hidden>
        {RISK_CLASSES.map(({ label, color }) => (
          <div key={label} className="flex-1" style={{ backgroundColor: color }} />
        ))}
      </div>
      <ul className="flex gap-[3px] text-center text-[10px] leading-[14px] text-slate-700">
        {RISK_CLASSES.map(({ label }) => (
          <li key={label} className="flex-1">
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CategoriesLegend({ items }: Readonly<{ items: readonly LegendSwatch[] }>) {
  return (
    <ul className="flex flex-wrap gap-1 px-1">
      {items.map(({ label, color, shape }) => (
        <li
          key={label}
          className="flex items-center gap-2 pr-4 text-[10px] leading-4 text-slate-700"
        >
          <span
            aria-hidden
            className={cn("size-3 shrink-0 rounded-[2px]", shape === "outline" && "border")}
            style={shape === "outline" ? { borderColor: color } : { backgroundColor: color }}
          />
          {label}
        </li>
      ))}
    </ul>
  );
}
