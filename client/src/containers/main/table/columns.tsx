import { ColumnDef } from "@tanstack/react-table";
import RiskIndexChart from "@/containers/main/table/risk-index-chart";
import { useScenario } from "@/store";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export type IndicatorStats = {
  min: number | null;
  max: number | null;
  mean: number | null;
};

export type Area = {
  id: string;
  name: string;
  name_fr: string;
  source: string;
  layer_type: string;
  status: string;
  designation_type: string;
  iucn_category: string;
  manager: string;
  url: string | null;
  area_km2: number | null;
  bbox: [number, number, number, number] | null;
  indicator: {
    name: string;
    scenario: {
      high: IndicatorStats;
      low: IndicatorStats;
    };
    type: "numerical" | "categorical";
  }[];
};

const NameCell = ({ id, name }: { id: string; name: string }) => {
  const navigate = useNavigate();

  const onClick = () => {
    navigate({ to: "/$area", params: { area: id } });
  };
  return (
    <Button
      className="max-w-full inline-block truncate hover:underline text-inherit cursor-pointer"
      variant={"link"}
      onClick={onClick}
    >
      {name}
    </Button>
  );
};

const IndicatorCell = ({ indicators }: { indicators: Area["indicator"] }) => {
  const [scenario] = useScenario();
  const climVuln = indicators.find((indicator) => indicator.name === "ClimVuln");

  if (!climVuln) return null;

  const { min, mean, max } = climVuln.scenario[scenario];

  return (
    <div className="border-l border-r border-slate-200 py-3 px-2">
      {min === null || mean === null || max === null ? (
        <p className="text-center text-xs text-slate-400">No data</p>
      ) : (
        <RiskIndexChart
          range={{
            min: 0,
            max: 1,
          }}
          values={{ min, mean, max }}
        />
      )}
    </div>
  );
};

export const columns: ColumnDef<Area>[] = [
  {
    accessorKey: "name",
    header: "Conservation Areas",
    cell: (ctx) => <NameCell id={ctx.row.original.id} name={ctx.row.original.name} />,
  },
  {
    accessorKey: "indicator",
    header: "Overall climate risk",
    cell: (ctx) => <IndicatorCell indicators={ctx.row.getValue("indicator")} />,
  },
];
