import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import RiskIndexChart from "@/containers/main/table/risk-index-chart";
import { useScenario } from "@/store";

const IndicatorCell = ({ indicators }: { indicators: Area["indicator"] }) => {
  const [scenario] = useScenario();
  const climVuln = indicators.find(
    (indicator) => indicator.name === "ClimVuln",
  );

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

export type Area = {
  name_en: string;
  type: string;
  website_url: string;
  area_ha: number;
  region: string;
  iucn_category: 1 | 2 | 3 | 4;
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

export const columns: ColumnDef<Area>[] = [
  {
    accessorKey: "name_en",
    header: "Conservation Areas",
    cell: (ctx) => (
      <Link
        href={`/${ctx.row.getValue("name_en")}`}
        className="max-w-full inline-block truncate hover:underline"
      >
        <span className="">{ctx.row.getValue("name_en")}</span>
      </Link>
    ),
  },
  {
    accessorKey: "indicator",
    header: "Overall climate risk",
    cell: (ctx) => <IndicatorCell indicators={ctx.row.getValue("indicator")} />,
  },
];
