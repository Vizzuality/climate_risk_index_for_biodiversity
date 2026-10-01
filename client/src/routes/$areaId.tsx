import { createFileRoute } from "@tanstack/react-router";
import { redirectLegacyArea } from "@/lib/legacy-redirects";

export const Route = createFileRoute("/$areaId")({
  beforeLoad: redirectLegacyArea,
});
