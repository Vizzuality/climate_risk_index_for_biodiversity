import Intro from "@/containers/detail/intro";
import AreaStats from "@/containers/detail/stats";
import ClimateRiskChart from "@/containers/detail/climate-risk-chart";

export default function Detail() {
  return (
    <div className="space-y-4">
      <Intro />
      <AreaStats />
      <ClimateRiskChart />
    </div>
  );
}
