"use client";

import * as React from "react";
import { CheckIcon, XIcon } from "lucide-react";

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
  PopoverClose,
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
      <div className="relative w-full flex">
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-start text-left relative"
          >
            <span className="inline-block max-w-[90%] overflow-hidden truncate">
              {searchValue
                ? (areas.find((area) => area.value === searchValue)?.label ??
                  searchValue)
                : "Choose an area"}
            </span>
          </Button>
        </PopoverTrigger>
        {searchValue && (
          <PopoverClose asChild className="absolute right-3">
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setOpen(false);
              }}
            >
              <XIcon className="absolute right-2 w-4 h-4 top-1/2 translate-y-[calc(50%+4px)]" />
            </button>
          </PopoverClose>
        )}
      </div>

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
