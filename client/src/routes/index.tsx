import { createFileRoute } from "@tanstack/react-router";
import { redirectToAreas } from "@/lib/legacy-redirects";

export const Route = createFileRoute("/")({
  beforeLoad: redirectToAreas,
});
