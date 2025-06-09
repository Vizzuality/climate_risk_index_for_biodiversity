import Intro from "@/containers/main/intro";
import Filters from "@/containers/main/filters";
import DataTable from "@/containers/main/table";

export default function Main() {
  return (
    <>
      <Intro />
      <Filters />

      <DataTable />
    </>
  );
}
