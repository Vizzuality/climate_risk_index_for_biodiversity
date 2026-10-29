import { Search } from "@/containers/main/filters/search";
import { SpeciesFilterBadges } from "@/containers/species/filters/badges";
import { SpeciesFiltersModal } from "@/containers/species/filters/modal";

export function SpeciesFilters() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Search placeholder="Search species by name" />
        <SpeciesFiltersModal />
      </div>
      <SpeciesFilterBadges />
    </div>
  );
}
