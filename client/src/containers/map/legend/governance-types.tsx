import { useMemo } from "react";

import { useFilteredAreas } from "@/hooks/use-filtered-areas";
import { PROTECTION_TYPE_VALUES, PROTECTION_TYPES } from "@/lib/protection-types";
import { cn } from "@/lib/utils";
import { useHiddenAreaTypes } from "@/store";

const TEXT_CLASS_NAME = "text-[10px] leading-[14px]";

// The rows only show or hide types on the map; the area filters narrow which areas are counted.
export function GovernanceTypesLegend() {
  const { data: matches } = useFilteredAreas();
  const [hidden, setHidden] = useHiddenAreaTypes();

  const counts = useMemo(() => {
    const byType = new Map<string, number>();
    for (const area of matches ?? []) {
      byType.set(area.governance_type, (byType.get(area.governance_type) ?? 0) + 1);
    }
    return byType;
  }, [matches]);

  const shown = PROTECTION_TYPE_VALUES.length - hidden.length;
  const allOn = hidden.length === 0;

  return (
    <>
      <ul className="flex flex-col">
        {PROTECTION_TYPES.map(({ value, governanceType, shortLabel: label, color, fillColor }) => {
          const on = !hidden.includes(value);
          return (
            <li
              key={value}
              className={cn(
                "group relative flex h-6 items-center gap-2 rounded-[4px] pr-2",
                "has-[button:focus-visible]:outline-2 has-[button:focus-visible]:-outline-offset-2 has-[button:focus-visible]:outline-teal-400 hover:bg-[#eef2f7]",
              )}
            >
              <button
                type="button"
                aria-pressed={on}
                onClick={() =>
                  setHidden(on ? [...hidden, value] : hidden.filter((type) => type !== value))
                }
                className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 self-stretch pl-1 text-left focus-visible:outline-none"
              >
                <Swatch color={color} fillColor={fillColor} on={on} />
                <span className={cn(TEXT_CLASS_NAME, "truncate text-slate-700")}>{label}</span>
              </button>
              <span
                className={cn(
                  TEXT_CLASS_NAME,
                  on ? "text-slate-500" : "text-slate-700",
                  "group-hover:invisible group-has-[[data-only]:focus-visible]:invisible",
                )}
              >
                {counts.get(governanceType) ?? (matches ? 0 : undefined)}
              </span>
              <button
                type="button"
                data-only
                aria-label={`Show only ${label}`}
                onClick={() => setHidden(PROTECTION_TYPE_VALUES.filter((type) => type !== value))}
                className={cn(
                  TEXT_CLASS_NAME,
                  "absolute right-2 cursor-pointer text-teal-700 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none",
                )}
              >
                Only
              </button>
            </li>
          );
        })}
      </ul>
      <div
        className={cn(
          TEXT_CLASS_NAME,
          "flex gap-2 border-t border-slate-300 py-1.5 pr-2 pl-1 text-slate-500",
        )}
      >
        <p className="flex-1">
          {allOn && "Click a type to show or hide it on the map"}
          {shown === 0 && "No types shown"}
          {!allOn && shown > 0 && `${shown} of ${PROTECTION_TYPE_VALUES.length} types shown`}
        </p>
        {!allOn && (
          <button
            type="button"
            onClick={() => setHidden([])}
            className="cursor-pointer text-teal-700 hover:underline"
          >
            Show all
          </button>
        )}
      </div>
    </>
  );
}

function Swatch({
  color,
  fillColor,
  on,
}: Readonly<{ color: string; fillColor: string; on: boolean }>) {
  if (!on)
    return <span aria-hidden className="size-3.5 shrink-0 rounded-[3px] border border-slate-500" />;
  return (
    <span
      aria-hidden
      className="relative size-3.5 shrink-0 rounded-[3px] bg-slate-700 group-hover:bg-[#242d4c]"
    >
      <span
        className="absolute top-0.5 left-0.5 size-2.5 rounded-[2px] border-[1.5px]"
        style={{ borderColor: color, backgroundColor: fillColor }}
      />
    </span>
  );
}
