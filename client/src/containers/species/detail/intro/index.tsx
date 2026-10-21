import { Link } from "@tanstack/react-router";

import { type SpeciesDetail, speciesName } from "@/lib/species";

export default function SpeciesIntro({ species }: { species: SpeciesDetail }) {
  const name = speciesName(species);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 items-center text-xs text-slate-400">
        <Link to="/species" className="italic">
          Species
        </Link>
        <span className="text-slate-400 text-base">{">"}</span>
        <span className="truncate text-slate-700 italic first-letter:uppercase">{name}</span>
      </div>
      <div>
        <h2 className="text-2xl text-slate-700 font-semibold first-letter:uppercase">{name}</h2>
        {species.common_name && <p className="italic text-slate-500">{species.scientific_name}</p>}
      </div>
      <p className="text-slate-400 mt-4">
        Below you’ll find the climate risk of the selected species over its whole range, as well as
        the twelve indicators that make up the Climate Risk Index.
      </p>
    </div>
  );
}
