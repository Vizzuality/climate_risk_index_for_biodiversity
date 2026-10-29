import { CircleXIcon } from "lucide-react";

type Badge<K extends string> = Readonly<{ key: K; value: string; label: string }>;

type FilterBadgeListProps<K extends string> = Readonly<{
  badges: readonly Badge<K>[];
  onRemove: (key: K, value: string) => void;
}>;

export function FilterBadgeList<K extends string>({ badges, onRemove }: FilterBadgeListProps<K>) {
  if (!badges.length) return null;

  return (
    <ul aria-label="Applied filters" className="flex flex-wrap gap-2">
      {badges.map(({ key, value, label }) => (
        <li key={`${key}-${value}`}>
          <button
            type="button"
            aria-label={`Remove ${label} filter`}
            onClick={() => onRemove(key, value)}
            className="flex cursor-pointer items-center gap-2 rounded-3xl bg-teal-200 px-2.5 py-1 text-xs leading-4 text-teal-950 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {label}
            <CircleXIcon aria-hidden className="size-3 text-slate-700" strokeWidth={2.4} />
          </button>
        </li>
      ))}
    </ul>
  );
}
