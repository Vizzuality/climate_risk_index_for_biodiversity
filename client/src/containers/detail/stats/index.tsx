import { useSelectedArea } from "@/hooks/use-selected-area";

const areaFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

export default function AreaStats() {
  const area = useSelectedArea();

  const rows: { label: string; value: string | null | undefined }[] = [
    { label: "Manager", value: area?.manager },
    {
      label: "Total area",
      value: area?.area_km2 != null ? `${areaFormatter.format(area.area_km2)} km²` : null,
    },
    { label: "Designation", value: area?.designation_type },
    { label: "IUCN category", value: area?.iucn_category },
    { label: "Status", value: area?.status },
  ];

  return (
    <ul className="space-y-2">
      {rows.map(({ label, value }) => (
        <li
          key={label}
          className="flex items-center gap-1 py-2 border-b border-dashed border-b-slate-300 text-slate-600"
        >
          <span className="flex-1 uppercase font-semibold text-xs">{label}</span>
          <span className="flex-1">{value || "N/A"}</span>
        </li>
      ))}
      <li className="flex items-center gap-1 py-2 border-b border-dashed border-b-slate-300 text-slate-600">
        <span className="flex-1 uppercase font-semibold text-xs">Website</span>
        <span className="flex flex-1 min-w-0">
          {area?.url ? (
            <a href={area.url} target="_blank" rel="noopener noreferrer" className="truncate">
              {area.url}
            </a>
          ) : (
            "N/A"
          )}
        </span>
      </li>
    </ul>
  );
}
