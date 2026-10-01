import { createFileRoute } from "@tanstack/react-router";
import Main from "@/containers/main";

export const Route = createFileRoute("/_dashboard/areas/")({
  component: Areas,
});

function Areas() {
  return (
    <div className=" flex flex-col h-full gap-4">
      <Main />
    </div>
  );
}
