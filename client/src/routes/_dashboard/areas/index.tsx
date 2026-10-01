import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import Main from "@/containers/main";
import { AREA_LIST_SEARCH_DEFAULTS, validateAreaListSearch } from "@/containers/main/store";

export const Route = createFileRoute("/_dashboard/areas/")({
  validateSearch: validateAreaListSearch,
  search: { middlewares: [stripSearchParams(AREA_LIST_SEARCH_DEFAULTS)] },
  component: Areas,
});

function Areas() {
  return (
    <div className=" flex flex-col h-full gap-4">
      <Main />
    </div>
  );
}
