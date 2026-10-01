import Intro from "@/containers/detail/intro";
import AreaStats from "@/containers/detail/stats";
import ClimateRiskChart from "@/containers/detail/climate-risk-chart";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { useAreas } from "@/hooks/use-areas";
import { useSelectedArea } from "@/hooks/use-selected-area";

export default function Detail() {
  const { isPending } = useAreas();
  const area = useSelectedArea();

  if (isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!area) {
    return (
      <div className="space-y-4 text-slate-600">
        <p>This conservation area couldn’t be found.</p>
        <Link to="/areas" className="text-sm text-slate-700 underline">
          Back to all conservation areas
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Intro />
      <AreaStats />
      <ClimateRiskChart />
    </div>
  );
}
