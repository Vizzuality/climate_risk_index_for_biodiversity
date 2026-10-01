import { useEffect, useRef, useState } from "react";
import { SearchIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { useAreaSearch } from "@/containers/main/store";

import { useDebounce } from "@/hooks/use-debounce";

export function Search() {
  const [q, setQ] = useAreaSearch();
  const [value, setValue] = useState(q);
  // The last value this input wrote, so its own round-trip through the URL doesn't
  // overwrite keystrokes typed while the navigation was in flight.
  const written = useRef(q);
  const [writeDebounced, cancelWrite] = useDebounce((next: string) => {
    written.current = next;
    setQ(next);
  }, 200);

  useEffect(() => {
    if (q === written.current) return;
    cancelWrite();
    written.current = q;
    setValue(q);
  }, [q, cancelWrite]);

  return (
    <div className="relative flex-1">
      <SearchIcon
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-slate-500"
      />
      <Input
        type="search"
        aria-label="Search area by name"
        placeholder="Search area by name"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          writeDebounced(e.target.value);
        }}
        className="h-10 w-full rounded-[4px] border-slate-300 pl-10 shadow-none placeholder:text-slate-500"
      />
    </div>
  );
}
