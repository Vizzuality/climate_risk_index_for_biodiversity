import { createFileRoute } from "@tanstack/react-router";
import SpeciesDetail from "@/containers/species/detail";

export const Route = createFileRoute("/_dashboard/species/$speciesId")({
  component: Species,
});

function Species() {
  return (
    <div className=" flex flex-col h-full gap-4">
      <SpeciesDetail />
    </div>
  );
}
