import { FiltersModal } from "@/containers/main/filters/modal";
import { Search } from "@/containers/main/filters/search";

export function Filters() {
  return (
    <div className="flex items-center gap-2">
      <Search />
      <FiltersModal />
    </div>
  );
}
