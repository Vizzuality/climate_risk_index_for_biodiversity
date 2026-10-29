import { useMemo } from "react";
import { useMatchRoute } from "@tanstack/react-router";

import { useAreaFilters, useListSearch } from "@/containers/main/store";
import { useAreaIdsWithSpecies } from "@/hooks/use-area-ids-with-species";
import { useAreas } from "@/hooks/use-areas";
import {
  PROTECTION_TYPE_VALUES,
  PROTECTION_TYPES,
  type ProtectionType,
} from "@/lib/protection-types";
import { cn } from "@/lib/utils";
import { filterAreas, filterByAreaName } from "@/utils/filters";

const TEXT_CLASS_NAME = "text-[10px] leading-[14px]";

export function GovernanceTypesLegend() {
  const matchRoute = useMatchRoute();
  // The area filters only apply to the list; elsewhere the rows just show the selection.
  const interactive = Boolean(matchRoute({ to: "/areas" }));
  const [q] = useListSearch();
  const [filters, applyFilters] = useAreaFilters();
  const { data } = useAreas();
  const { data: speciesAreaIds } = useAreaIdsWithSpecies(filters.species);

  const counts = useMemo(() => {
    const byType = new Map<string, number>();
    if (!data) return byType;
    // Counted under every other filter, so each shows what switching its type on would add.
    const others = { ...filters, protection: [] };
    for (const area of filterAreas(filterByAreaName(data, q), others, speciesAreaIds)) {
      byType.set(area.governance_type, (byType.get(area.governance_type) ?? 0) + 1);
    }
    return byType;
  }, [data, q, filters, speciesAreaIds]);

  const selected = filters.protection;
  const allOn = selected.length === PROTECTION_TYPE_VALUES.length;
  const setProtection = (protection: ProtectionType[]) => applyFilters({ ...filters, protection });

  return (
    <>
      <ul className="flex flex-col">
        {PROTECTION_TYPES.map(({ value, governanceType, shortLabel: label, color }) => {
          const on = selected.includes(value);
          return (
            <li
              key={value}
              className={cn(
                "group relative flex h-6 items-center gap-2 rounded-[4px] pr-2",
                "has-[button:focus-visible]:outline-2 has-[button:focus-visible]:-outline-offset-2 has-[button:focus-visible]:outline-teal-400",
                interactive && "hover:bg-[#eef2f7]",
              )}
            >
              <button
                type="button"
                aria-pressed={on}
                disabled={!interactive}
                onClick={() =>
                  setProtection(
                    on ? selected.filter((type) => type !== value) : [...selected, value],
                  )
                }
                className="flex min-w-0 flex-1 items-center gap-2 self-stretch pl-1 text-left enabled:cursor-pointer focus-visible:outline-none"
              >
                <Swatch color={color} on={on} />
                <span className={cn(TEXT_CLASS_NAME, "truncate text-slate-700")}>{label}</span>
              </button>
              <span
                className={cn(
                  TEXT_CLASS_NAME,
                  on ? "text-slate-500" : "text-slate-700",
                  interactive &&
                    "group-hover:invisible group-has-[[data-only]:focus-visible]:invisible",
                )}
              >
                {counts.get(governanceType)}
              </span>
              {interactive && (
                <button
                  type="button"
                  data-only
                  aria-label={`Show only ${label}`}
                  onClick={() => setProtection([value])}
                  className={cn(
                    TEXT_CLASS_NAME,
                    "absolute right-2 cursor-pointer text-teal-700 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none",
                  )}
                >
                  Only
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {interactive && (
        <div
          className={cn(
            TEXT_CLASS_NAME,
            "flex gap-2 border-t border-slate-300 py-1.5 pr-2 pl-1 text-slate-500",
          )}
        >
          <p className="flex-1">
            {allOn && "Click a type to filter map and table"}
            {selected.length === 0 && "No types selected"}
            {!allOn &&
              selected.length > 0 &&
              `${selected.length} of ${PROTECTION_TYPE_VALUES.length} types`}
          </p>
          {!allOn && (
            <button
              type="button"
              onClick={() => setProtection([...PROTECTION_TYPE_VALUES])}
              className="cursor-pointer text-teal-700 hover:underline"
            >
              Show all
            </button>
          )}
        </div>
      )}
    </>
  );
}

function Swatch({ color, on }: Readonly<{ color: string; on: boolean }>) {
  if (!on)
    return <span aria-hidden className="size-3.5 shrink-0 rounded-[3px] border border-slate-500" />;
  return (
    <span
      aria-hidden
      className="relative size-3.5 shrink-0 rounded-[3px] bg-slate-700 group-hover:bg-[#242d4c]"
    >
      <span
        className="absolute top-0.5 left-0.5 size-2.5 rounded-[2px] border-[1.5px]"
        style={{ borderColor: color, backgroundColor: `${color}33` }}
      />
    </span>
  );
}
