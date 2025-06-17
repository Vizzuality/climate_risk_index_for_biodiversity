export default function RiskIndexChart({
  range,
  values,
}: {
  range: {
    min: number;
    max: number;
  };
  values: {
    min: number;
    max: number;
    mean: number;
  };
}) {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="h-[1px] bg-slate-300 w-full relative">
        <div className="h-[32px] top-1/2 -translate-1/2 border-l border-dashed  border-slate-300 absolute left-[25%]" />
        <div className="h-[32px] top-1/2 -translate-1/2 border-l border-dashed  border-slate-300 absolute left-[50%]" />
        <div className="h-[32px] top-1/2 -translate-1/2 border-l border-dashed  border-slate-300 absolute left-[75%]" />
        <div
          className="absolute bg-slate-500 h-[1px] rounded-full"
          style={{
            left: `${((values.min - range.min) / (range.max - range.min)) * 100}%`,
            width: `${((values.max - values.min) / (range.max - range.min)) * 100}%`,
          }}
        >
          <div
            className="absolute"
            style={{
              left: `${((values.mean - range.min) / (range.max - range.min)) * 100}%`,
              top: "-4px",
              transform: "translateX(-50%)",
            }}
          >
            <div className="w-2 h-2 bg-blue-500 rotate-45" />
          </div>
        </div>
      </div>
    </div>
  );
}
