import Intro from "@/containers/species/intro";
import { SpeciesFilters } from "@/containers/species/filters";
import SpeciesTable from "@/containers/species/table";

export default function SpeciesList() {
  return (
    <>
      <Intro />
      <SpeciesFilters />
      <SpeciesTable />
    </>
  );
}
