import { createFileRoute } from "@tanstack/react-router";
import Main from "@/containers/main";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <div className=" flex flex-col h-full gap-4">
      <Main />
    </div>
  );
}
