import Intro from "@/containers/detail/intro";
import AreaStats from "@/containers/detail/stats";
import ClimateRiskChart from "@/containers/detail/climate-risk-chart";
import { Skeleton } from "@/components/ui/skeleton";
import { useAreas } from "@/hooks/use-areas";

export default function Detail() {
  const { isPending } = useAreas();

  if (isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
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
