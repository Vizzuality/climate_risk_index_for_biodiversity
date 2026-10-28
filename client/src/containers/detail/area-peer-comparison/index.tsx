import { useMemo } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import { RiskIndexChart } from "@/containers/main/table/risk-index-chart";
import { useAreas } from "@/hooks/use-areas";
import { useSelectedArea } from "@/hooks/use-selected-area";
import { areaPeerComparison } from "@/lib/area-peer-comparison";

export default function AreaPeerComparison() {
  const area = useSelectedArea();
  const { data: areas } = useAreas();
  const rows = useMemo(() => (area && areas ? areaPeerComparison(area, areas) : []), [area, areas]);

  return (
    <section className="space-y-4">
      <h3 className="text-slate-700 font-semibold text-[20px]">Comparison</h3>
      <p className="text-slate-700">
        Overall climate risk of the area against the average of the other areas in the same
        bioregion and of the same governance type.
      </p>
      <Table className="table-fixed">
        <TableBody>
          {rows.map(({ key, label, description, values }) => (
            <TableRow key={key}>
              <TableCell className="whitespace-normal text-slate-700">
                <span className="block">{label}</span>
                {description && <span className="block text-xs text-slate-500">{description}</span>}
              </TableCell>
              <TableCell className="w-47 px-2">
                {values ? (
                  <RiskIndexChart range={{ min: 0, max: 1 }} values={values} />
                ) : (
                  <p className="flex h-6 items-center justify-center text-xs text-slate-500">
                    No data
                  </p>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter className="bg-transparent">
          <TableRow className="hover:bg-transparent">
            <TableHead>
              <span className="sr-only">Group</span>
            </TableHead>
            <TableHead className="w-47 text-xs uppercase text-slate-700 text-center">
              Overall climate risk
            </TableHead>
          </TableRow>
        </TableFooter>
      </Table>
    </section>
  );
}
