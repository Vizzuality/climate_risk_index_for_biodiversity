import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const formatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

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
          <Popover>
            <PopoverTrigger>
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
            </PopoverTrigger>
            <PopoverContent className="w-auto" side="top" sideOffset={30}>
              <ul className="flex flex-col gap-1 text-xs">
                <li>
                  Min:{" "}
                  <span className="font-semibold">
                    {formatter.format(values.min)}
                  </span>
                </li>
                <li>
                  Mean:{" "}
                  <span className="font-semibold">
                    {formatter.format(values.mean)}
                  </span>
                </li>
                <li>
                  Max:{" "}
                  <span className="font-semibold">
                    {formatter.format(values.max)}
                  </span>
                </li>
              </ul>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
