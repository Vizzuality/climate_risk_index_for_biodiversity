import { Button } from "@/components/ui/button";
import Search from "@/containers/main/filters/search";

export default function Filters() {
  return (
    <div className="flex items-center space-x-2 justify-between">
      <Search />
      <Button className="text-slate-700">Filters</Button>
    </div>
  );
}
