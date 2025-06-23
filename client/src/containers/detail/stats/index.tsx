"use client";

import { ExternalLinkIcon } from "lucide-react";
import { useSelectedArea } from "@/hooks/use-selected-area";

export default function AreaStats() {
  const area = useSelectedArea();

  return (
    <ul className="space-y-2">
      <li className="flex items-center gap-1 py-2 border-b border-dashed border-b-slate-300 text-slate-600">
        <span className="flex-1 uppercase font-semibold text-xs">Region</span>
        <span className="flex-1">{area?.admin_region ?? "N/A"}</span>
      </li>
      <li className="flex items-center gap-1 py-2 border-b border-dashed border-b-slate-300 text-slate-600">
        <span className="flex-1 uppercase font-semibold text-xs">
          Total area
        </span>
        <span className="flex-1">{area?.area_ha ?? "N/A"}</span>
      </li>
      <li className="flex items-center gap-1 py-2 border-b border-dashed border-b-slate-300 text-slate-600">
        <span className="flex-1 uppercase font-semibold text-xs">
          area type
        </span>
        <span className="flex-1">{area?.type ?? "N/A"}</span>
      </li>
      <li className="flex items-center gap-1 py-2 border-b border-dashed border-b-slate-300 text-slate-600">
        <span className="flex-1 uppercase font-semibold text-xs">DFO site</span>
        <span className="flex flex-1 gap-1 items-center">
          {area?.website_url ? (
            <>
              <a
                href={area?.website_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {area.website_url}
              </a>
              <ExternalLinkIcon className="text-slate-700 h-4 w-4" />
            </>
          ) : (
            "N/A"
          )}
        </span>
      </li>
    </ul>
  );
}
