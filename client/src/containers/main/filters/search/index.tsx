"use client";

import * as React from "react";
import { CheckIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { searchAtom } from "@/containers/main/store";
import { useAtom } from "jotai";

import data from "@/data/wdpa.json";
import { Area } from "@/containers/main/table/columns";

const areas = (data as Area[]).map((area) => ({
  value: area.name_en,
  label: area.name_en,
}));

export default function Search() {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearch] = useAtom(searchAtom);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-start shrink text-left"
        >
          {searchValue
            ? (areas.find((area) => area.value === searchValue)?.label ??
              searchValue)
            : "Choose an area"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[337px] p-0">
        <Command
          filter={() => {
            return 1;
          }}
        >
          <CommandInput
            placeholder="Search area by name or region..."
            onKeyDown={(v) => {
              if (v.key === "Enter") {
                v.preventDefault();
                setOpen(false);
                // @ts-expect-error fix later
                setSearch(v.target.value);
              }
            }}
          />
          <CommandList>
            <CommandGroup>
              {areas.map((area) => (
                <CommandItem
                  key={area.value}
                  value={area.value}
                  onSelect={(currentValue) => {
                    setSearch(currentValue === searchValue ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  <CheckIcon
                    className={cn(
                      "mr-2 h-4 w-4",
                      searchValue === area.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {area.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
