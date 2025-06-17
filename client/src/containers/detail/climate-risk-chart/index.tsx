import Chart from "@/containers/detail/climate-risk-chart/chart";

export default function ClimateRiskChart() {
  return (
    <div className="climate-risk-chart space-y-4">
      <h3 className="text-slate-700 font-semibold text-[20px]">Climate Risk</h3>
      <p className="text-slate-700">
        Climate Risk represented in the 3 dimensions of risk and the
        sub-dimensions.
      </p>
      <div className="flex gap-2 items-center">
        <span className="uppercase font-semibold text-slate-700 tracking-wide text-xs">
          risk:
        </span>

        <ul className="flex gap-2">
          <li className="flex gap-1 items-center">
            <span className="h-[10px] w-[10px] inline-block bg-[#45B9C7]" />
            <span className="text-xs text-slate-700 tracking-wide">
              Negligible
            </span>
          </li>
          <li className="flex gap-1 items-center">
            <span className="h-[10px] w-[10px] inline-block bg-[#B5E2D1]" />
            <span className="text-xs text-slate-700 tracking-wide">
              Moderate
            </span>
          </li>
          <li className="flex gap-1 items-center">
            <span className="h-[10px] w-[10px] inline-block bg-[#F1BC83]" />
            <span className="text-xs text-slate-700 tracking-wide">High</span>
          </li>
          <li className="flex gap-1 items-center">
            <span className="h-[10px] w-[10px] inline-block bg-[#D95730]" />
            <span className="text-xs text-slate-700 tracking-wide">
              Critical
            </span>
          </li>
        </ul>
      </div>
      <div className="chart-placeholder">
        <Chart />
      </div>
    </div>
  );
}
