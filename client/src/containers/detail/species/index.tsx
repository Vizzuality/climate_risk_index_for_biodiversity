import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import { useSelectedArea } from "@/hooks/use-selected-area";
import { riskClassFor } from "@/lib/risk-colormap";
import { useScenario } from "@/store";

const scoreFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function RiskBadge({ value }: { value: number }) {
  const { color, label } = riskClassFor(value);
  return (
    <span
      className="inline-flex items-center rounded-sm px-1.5 py-0.5 text-xs font-medium text-slate-900"
      style={{ backgroundColor: color }}
    >
      {label}
    </span>
  );
}

export default function AreaSpecies() {
  const area = useSelectedArea();
  const [scenario] = useScenario();
  const species = area?.species[scenario] ?? [];

  return (
    <section className="space-y-4">
      <h3 className="text-slate-700 font-semibold text-[20px]">Species within the area</h3>
      <p className="text-slate-700">
        The species with the highest climate risk in the area, weighted by how much of the area they
        occupy.
      </p>
      {species.length === 0 ? (
        <p className="text-sm text-slate-400">No species data for this scenario.</p>
      ) : (
        <Table>
          <TableBody>
            {species.map(({ id, common_name, scientific_name, score }) => (
              <TableRow key={id}>
                <TableCell className="whitespace-normal text-slate-700">
                  {common_name && <span className="block capitalize">{common_name}</span>}
                  <span className="block italic text-slate-500">{scientific_name}</span>
                </TableCell>
                <TableCell>
                  <span className="flex items-center justify-end gap-2 tabular-nums text-slate-700">
                    {scoreFormatter.format(score)}
                    <RiskBadge value={score} />
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter className="bg-transparent">
            <TableRow className="hover:bg-transparent">
              <TableHead>
                <span className="sr-only">Species</span>
              </TableHead>
              <TableHead className="text-xs uppercase text-slate-700 text-right">
                CRIB risk index
              </TableHead>
            </TableRow>
          </TableFooter>
        </Table>
      )}
    </section>
  );
}
