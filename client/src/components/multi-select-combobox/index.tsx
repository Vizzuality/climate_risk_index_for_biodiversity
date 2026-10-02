import { useId, useState } from "react";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Option<T extends string> = Readonly<{ value: T; label: string }>;

type MultiSelectComboboxProps<T extends string> = Readonly<{
  id?: string;
  options: readonly Option<T>[];
  value: readonly T[];
  onChange: (next: T[]) => void;
  placeholder: string;
  searchPlaceholder?: string;
  disabled?: boolean;
}>;

function summarize(selected: readonly Option<string>[], placeholder: string) {
  if (selected.length === 0) return placeholder;
  if (selected.length === 1) return selected[0].label;
  return `${selected.length} selected`;
}

export function MultiSelectCombobox<T extends string>({
  id,
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  disabled,
}: MultiSelectComboboxProps<T>) {
  const [open, setOpen] = useState(false);
  const listId = useId();
  const selected = options.filter((option) => value.includes(option.value));
  const summary = summarize(selected, placeholder);

  const toggle = (option: T) =>
    onChange(value.includes(option) ? value.filter((v) => v !== option) : [...value, option]);

  return (
    // Modal so its scroll lock replaces an enclosing dialog's, which would block wheel scrolling
    // in the portalled list.
    <Popover modal open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          disabled={disabled}
          className="h-[35px] w-full justify-between rounded-[4px] border-slate-300 bg-slate-50 px-4 font-normal text-slate-700 shadow-none hover:bg-slate-100 hover:text-slate-700"
        >
          <span className="truncate">{summary}</span>
          <ChevronsUpDownIcon className="text-slate-500" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-(--radix-popover-trigger-width) rounded-[4px] border-slate-300 bg-slate-50 p-0 shadow-md"
      >
        <Command className="rounded-[4px] bg-slate-50 **:data-[slot=command-input-wrapper]:h-10 **:data-[slot=command-input-wrapper]:border-slate-300 **:data-[slot=command-input-wrapper]:px-3">
          {searchPlaceholder && (
            <CommandInput
              placeholder={searchPlaceholder}
              className="h-10 text-slate-700 placeholder:text-slate-700/50"
            />
          )}
          <CommandList id={listId} aria-multiselectable className="px-1 py-1.5">
            <CommandEmpty className="py-4 text-center text-sm text-slate-500">
              No matches
            </CommandEmpty>
            {options.map((option) => {
              const checked = value.includes(option.value);
              return (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  data-checked={checked}
                  onSelect={() => toggle(option.value)}
                  className="cursor-pointer px-2 py-1.5 text-slate-700 data-[selected=true]:bg-slate-100 data-[selected=true]:text-slate-700"
                >
                  <span className="flex-1">{option.label}</span>
                  {checked && (
                    <>
                      <CheckIcon aria-hidden className="text-slate-700" />
                      <span className="sr-only">(selected)</span>
                    </>
                  )}
                </CommandItem>
              );
            })}
          </CommandList>
          {value.length > 0 && (
            <div className="border-t border-slate-300 px-1 py-1.5">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onChange([])}
                className="h-8 w-full justify-start rounded-sm px-2 font-normal text-slate-700 hover:bg-slate-100 hover:text-slate-700"
              >
                Clear selection
              </Button>
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
