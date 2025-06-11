"use client";

import { useSelectedArea } from "@/hooks/use-selected-area";
import Link from "next/link";

export default function DetailIntro() {
  const area = useSelectedArea();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 items-center text-xs text-slate-400">
        <Link href="/" className="italic">
          Marine conservation areas
        </Link>
        <span className="text-slate-400 text-base">{">"}</span>
        <span className="truncate text-slate-700 italic">{area?.name}</span>
      </div>
      <h2 className="text-2xl text-slate-700 font-semibold">{area?.name}</h2>
      <p className="text-slate-400 mt-4">
        Below you’ll find the key parameters of your selected area, as well as
        the twelve indicators that make up the Climate Risk Index. Lastly,
        you’ll see the species assessed within the area.
      </p>
    </div>
  );
}
