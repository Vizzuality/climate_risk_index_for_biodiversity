import Intro from "@/containers/detail/intro";
import AreaStats from "@/containers/detail/stats";
import ClimateRiskChart from "@/containers/detail/climate-risk-chart";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Detail() {
  return (
    <ScrollArea>
      <div className="space-y-4">
        <Intro />
        <AreaStats />
        <ClimateRiskChart />
      </div>
    </ScrollArea>
  );
}
