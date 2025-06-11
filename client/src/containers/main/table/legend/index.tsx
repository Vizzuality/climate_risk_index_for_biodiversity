export default function DataTableLegend() {
  return (
    <div className="absolute bottom-0 left-0 px-8 py-4 right-0 grid grid-cols-2 justify-between items-center backdrop-blur-xs">
      <span className="uppercase text-xs font-semibold tracking-widest text-slate-700">
        climate risk index
      </span>
      <div className="flex grow px-4">
        <div className="flex-1 flex flex-col gap-2">
          <div className="h-[9px] bg-[#45B9C7] w-full" />
          <span className="text-xs">Negligible</span>
        </div>
        <div className="flex-1 flex flex-col gap-2">
          <div className="h-[9px] bg-[#B5E2D1] w-full" />
          <span className="text-xs">Moderate</span>
        </div>
        <div className="flex-1 flex flex-col gap-2 text-center">
          <div className="h-[9px] bg-[#F1BC83] w-full" />
          <span className="text-xs">High</span>
        </div>
        <div className="flex-1 flex flex-col gap-2">
          <div className="h-[9px] bg-[#D95730] w-full" />
          <span className="text-xs">Critical</span>
        </div>
      </div>
    </div>
  );
}
