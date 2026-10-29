import { FilterBadges } from "@/containers/main/filters/badges";
import { FiltersModal } from "@/containers/main/filters/modal";
import { Search } from "@/containers/main/filters/search";

export function Filters() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Search placeholder="Search area by name" />
        <FiltersModal />
      </div>
      <FilterBadges />
    </div>
  );
}
