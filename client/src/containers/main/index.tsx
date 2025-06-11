import Intro from "@/containers/main/intro";
import Filters from "@/containers/main/filters";
import DataTable from "@/containers/main/table";
import DataTableLegend from "@/containers/main/table/legend";

export default function Main() {
  return (
    <>
      <Intro />
      <Filters />
      <DataTable />
      <DataTableLegend />
    </>
  );
}
