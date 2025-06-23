import { ColumnDef } from "@tanstack/react-table";
import RiskIndexChart from "@/containers/main/table/risk-index-chart";
import { useScenario } from "@/store";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useMap } from "react-map-gl/mapbox";
import data from "@/data/wdpa.json";

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
  const router = useRouter();
  const { default: map } = useMap();

  const areaBbox =
    (data as Area[]).find((area) => area.name_en === name)?.bbox || null;

  const onClick = () => {
    router.push(`/${name}`);

    if (areaBbox) {
      map?.fitBounds(
        [
          [areaBbox[0], areaBbox[1]],
          [areaBbox[2], areaBbox[3]],
        ],
        {
          animate: true,
          padding: {
            top: 50,
            bottom: 50,
            left: 630,
            right: 50,
          },
        },
      );
    }
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
