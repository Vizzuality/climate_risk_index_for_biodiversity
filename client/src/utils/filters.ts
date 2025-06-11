import { Area } from "@/containers/main/table/columns";

export function filterByAreaName(areas: Area[], searchTerm: string): Area[] {
  if (!searchTerm) return areas;

  const lowerCaseSearchTerm = searchTerm.toLowerCase();
  return areas.filter((area) =>
    area.name.toLowerCase().includes(lowerCaseSearchTerm),
  );
}
