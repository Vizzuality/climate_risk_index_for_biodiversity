import { ColumnDef } from "@tanstack/react-table";
import RiskIndexChart from "@/containers/main/table/risk-index-chart";
import { useScenario } from "@/store";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export type Area = {
  name_en: string;
  type: string;
  website_url: string;
  area_ha: number;
  admin_region: string;
  bbox: [number, number, number, number];
  indicator: {
    name: string;
    scenario: {
      high: {
        min: number;
        max: number;
        mean: number;
      };
      low: {
        min: number;
        max: number;
        mean: number;
      };
    };
    type: "numerical" | "categorical";
  }[];
};

const NameCell = ({ name }: { name: string }) => {
  const navigate = useNavigate();

  const onClick = () => {
    navigate({ to: "/$area", params: { area: name } });
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

  const values = climVuln.scenario[scenario];

  return (
    <div className="border-l border-r border-slate-200 py-3 px-2">
      <RiskIndexChart
        range={{
          min: 0,
          max: 1,
        }}
        values={values}
      />
    </div>
  );
};

export const columns: ColumnDef<Area>[] = [
  {
    accessorKey: "name_en",
    header: "Conservation Areas",
    cell: (ctx) => <NameCell name={ctx.row.getValue("name_en")} />,
  },
  {
    accessorKey: "indicator",
    header: "Overall climate risk",
    cell: (ctx) => <IndicatorCell indicators={ctx.row.getValue("indicator")} />,
  },
];
