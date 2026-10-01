import { useEffect, useRef, useState } from "react";

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
    <Input
      type="search"
      aria-label="Search area by name"
      placeholder="Search area by name"
      value={value}
      onChange={(e) => {
        setValue(e.target.value);
        writeDebounced(e.target.value);
      }}
      className="w-full"
    />
  );
}
