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

// `description` is shown under the label and matched by search too.
type Option<T extends string> = Readonly<{ value: T; label: string; description?: string }>;

// For long option lists: `suggested` is listed before typing, after any selected options, and
// typing searches every option, listing at most `maxResults` matches, label matches first.
type SuggestedSearch<T extends string> = Readonly<{
  suggested: readonly Option<T>[];
  maxResults: number;
}>;

type MultiSelectComboboxProps<T extends string> = Readonly<{
  id?: string;
  options: readonly Option<T>[];
  value: readonly T[];
  onChange: (next: T[]) => void;
  placeholder: string;
  searchPlaceholder?: string;
  suggestedSearch?: SuggestedSearch<T>;
  disabled?: boolean;
}>;

function summarize(selected: readonly Option<string>[], placeholder: string) {
  if (selected.length === 0) return placeholder;
  if (selected.length === 1) return selected[0].label;
  return `${selected.length} selected`;
}

function listedOptions<T extends string>(
  options: readonly Option<T>[],
  selected: readonly Option<T>[],
  { suggested, maxResults }: SuggestedSearch<T>,
  query: string,
) {
  const q = query.trim().toLowerCase();
  if (q) {
    const has = (text: string) => text.toLowerCase().includes(q);
    const byLabel = options.filter((option) => has(option.label));
    const byDescription = options.filter(
      (option) => !has(option.label) && option.description && has(option.description),
    );
    return [...byLabel, ...byDescription].slice(0, maxResults);
  }
  const pinned = selected.filter((option) => !suggested.some((s) => s.value === option.value));
  return [...pinned, ...suggested];
}

export function MultiSelectCombobox<T extends string>({
  id,
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  suggestedSearch,
  disabled,
}: MultiSelectComboboxProps<T>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const listId = useId();
  const selected = options.filter((option) => value.includes(option.value));
  const summary = summarize(selected, placeholder);
  const listed = suggestedSearch
    ? listedOptions(options, selected, suggestedSearch, query)
    : options;

  const toggle = (option: T) =>
    onChange(value.includes(option) ? value.filter((v) => v !== option) : [...value, option]);

  const handleOpenChange = (next: boolean) => {
    if (!next) setQuery("");
    setOpen(next);
  };

  return (
    // Modal so its scroll lock replaces an enclosing dialog's, which would block wheel scrolling
    // in the portalled list.
    <Popover modal open={open} onOpenChange={handleOpenChange}>
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
        <Command
          shouldFilter={!suggestedSearch}
          className="rounded-[4px] bg-slate-50 **:data-[slot=command-input-wrapper]:h-10 **:data-[slot=command-input-wrapper]:border-slate-300 **:data-[slot=command-input-wrapper]:px-3"
        >
          {searchPlaceholder && (
            <CommandInput
              placeholder={searchPlaceholder}
              value={query}
              onValueChange={setQuery}
              className="h-10 text-slate-700 placeholder:text-slate-700/50"
            />
          )}
          <CommandList id={listId} aria-multiselectable className="px-1 py-1.5">
            <CommandEmpty className="py-4 text-center text-sm text-slate-500">
              No matches
            </CommandEmpty>
            {listed.map((option) => {
              const checked = value.includes(option.value);
              return (
                <CommandItem
                  key={option.value}
                  // Items are told apart by `value`. Built-in filtering matches it, so it's the
                  // label there; otherwise the option value keeps shared labels apart.
                  value={suggestedSearch ? option.value : option.label}
                  keywords={option.description ? [option.description] : undefined}
                  data-checked={checked}
                  onSelect={() => toggle(option.value)}
                  className="cursor-pointer px-2 py-1.5 text-slate-700 data-[selected=true]:bg-slate-100 data-[selected=true]:text-slate-700"
                >
                  <span className="flex flex-1 flex-col">
                    {option.label}
                    {option.description && (
                      <span className="text-xs italic text-slate-500">{option.description}</span>
                    )}
                  </span>
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
