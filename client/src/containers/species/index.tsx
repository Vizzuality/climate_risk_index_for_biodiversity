import Intro from "@/containers/species/intro";
import { Search } from "@/containers/main/filters/search";
import SpeciesTable from "@/containers/species/table";

export default function SpeciesList() {
  return (
    <>
      <Intro />
      {/* A row like the areas filters, so the search's flex-1 grows sideways only */}
      <div className="flex items-center gap-2">
        <Search placeholder="Search species by name" />
      </div>
      <SpeciesTable />
    </>
  );
}
