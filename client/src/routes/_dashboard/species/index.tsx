import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import SpeciesList from "@/containers/species";
import {
  SPECIES_LIST_SEARCH_DEFAULTS,
  validateSpeciesListSearch,
} from "@/containers/species/store";

export const Route = createFileRoute("/_dashboard/species/")({
  validateSearch: validateSpeciesListSearch,
  search: { middlewares: [stripSearchParams(SPECIES_LIST_SEARCH_DEFAULTS)] },
  component: Species,
});

function Species() {
  return (
    <div className=" flex flex-col h-full gap-4">
      <SpeciesList />
    </div>
  );
}
