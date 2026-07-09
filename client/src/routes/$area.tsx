import { createFileRoute } from "@tanstack/react-router";
import Detail from "@/containers/detail";

export const Route = createFileRoute("/$area")({
  component: Area,
});

function Area() {
  return (
    <div className=" flex flex-col h-full gap-4">
      <Detail />
    </div>
  );
}
