"use client";

import { ExternalLinkIcon } from "lucide-react";
import { useSelectedArea } from "@/hooks/use-selected-area";

export default function AreaStats() {
  const area = useSelectedArea();

  return (
    <ul className="space-y-2">
      <li className="flex items-center gap-1 py-2 border-b border-dashed border-b-slate-300">
        <span className="flex-1">Region</span>
        <span className="flex-1">{area?.region}</span>
      </li>
      <li className="flex items-center gap-1 py-2 border-b border-dashed border-b-slate-300">
        <span className="flex-1">Total area</span>
        <span className="flex-1">{area?.area_ha}</span>
      </li>
      <li className="flex items-center gap-1 py-2 border-b border-dashed border-b-slate-300">
        <span className="flex-1">IUCN protected area</span>
        <span className="flex-1">{area?.iucn_category}</span>
      </li>
      <li className="flex items-center gap-1 py-2 border-b border-dashed border-b-slate-300">
        <span className="flex-1">area type</span>
        <span className="flex-1">{area?.type}</span>
      </li>
      {/*<li className="flex items-center gap-1 py-2 border-b border-dashed border-b-slate-300">*/}
      {/*  <span className="flex-1">Number of species</span>*/}
      {/*  <span className="flex-1">TBD</span>*/}
      {/*</li>*/}
      <li className="flex items-center gap-1 py-2 border-b border-dashed border-b-slate-300">
        <span className="flex-1">DFO site</span>
        <span className="flex flex-1 gap-1 items-center">
          <a href="" target="_blank" rel="noopener noreferrer">
            {area?.website_url}
          </a>
          <ExternalLinkIcon className="text-slate-700 h-4 w-4" />
        </span>
      </li>
      <li className="flex items-center gap-1 py-2">
        <span className="flex-1">Type of site</span>
        <span className="flex flex-1 gap-1 items-center">
          <a href="" target="_blank" rel="noopener noreferrer">
            {area?.type}
          </a>
          <ExternalLinkIcon className="text-slate-700 h-4 w-4" />
        </span>
      </li>
    </ul>
  );
}
