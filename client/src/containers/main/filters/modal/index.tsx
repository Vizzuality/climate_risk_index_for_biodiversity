import { useId, useState } from "react";
import { XIcon } from "lucide-react";

import { MultiSelectCombobox } from "@/components/multi-select-combobox";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BIOREGIONS } from "@/lib/bioregions";
import { PROTECTION_TYPES } from "@/lib/protection-types";
import { cn } from "@/lib/utils";
import { AREA_FILTER_DEFAULTS, type AreaFilters, useAreaFilters } from "@/containers/main/store";

const SIZE_OPTIONS = ["<200Ha", "200-500Ha", "500-1000Ha", ">1000Ha"];
const DEPTH_OPTIONS = ["100m", "200m", "1000m", "4000m"];

const BUTTON_CLASSES = "h-9 rounded-[4px] font-normal text-slate-700";

const FIELD_LABEL_CLASSES = "text-sm text-slate-800";

type ComboboxFieldProps<T extends string> = Readonly<
  { label: string } & Omit<React.ComponentProps<typeof MultiSelectCombobox<T>>, "id">
>;

function ComboboxField<T extends string>({ label, ...props }: ComboboxFieldProps<T>) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className={FIELD_LABEL_CLASSES}>
        {label}
      </label>
      <MultiSelectCombobox id={id} {...props} />
    </div>
  );
}

const NO_OPTIONS = { options: [], value: [], onChange: () => {}, disabled: true } as const;

type CheckboxFieldProps = Readonly<{ label: string; options: string[] }>;

function CheckboxField({ label, options }: CheckboxFieldProps) {
  const id = useId();
  return (
    <fieldset className="flex flex-col gap-1">
      <legend className={cn(FIELD_LABEL_CLASSES, "mb-1")}>{label}</legend>
      <div className="flex flex-wrap gap-x-8 gap-y-2">
        {options.map((option) => (
          <div key={option} className="flex items-center gap-2">
            <Checkbox
              id={`${id}-${option}`}
              disabled
              className="border-primary bg-slate-50 shadow-none"
            />
            <label
              htmlFor={`${id}-${option}`}
              className="text-sm text-slate-700 peer-disabled:opacity-50"
            >
              {option}
            </label>
          </div>
        ))}
      </div>
    </fieldset>
  );
}

export function FiltersModal() {
  const [filters, applyFilters] = useAreaFilters();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<AreaFilters>(filters);

  const handleOpenChange = (next: boolean) => {
    if (next) setDraft(filters);
    setOpen(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="h-10 rounded-[4px] px-4 font-normal text-slate-700 shadow-none">
          Filters
        </Button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="gap-8 rounded-lg border-0 bg-slate-50 p-6 sm:max-w-[560px]"
      >
        <DialogTitle className="text-lg leading-7 font-semibold tracking-[-0.54px] text-slate-700">
          Filters
        </DialogTitle>
        <DialogDescription className="sr-only">
          Narrow the conservation areas shown in the table and on the map.
        </DialogDescription>

        <div className="flex flex-col gap-6">
          <ComboboxField
            label="Type of protection"
            placeholder="Select type of protection"
            options={PROTECTION_TYPES}
            value={draft.protection}
            onChange={(protection) => setDraft((prev) => ({ ...prev, protection }))}
          />
          <ComboboxField
            label="Regions"
            placeholder="Select region"
            searchPlaceholder="Search region"
            options={BIOREGIONS}
            value={draft.region}
            onChange={(region) => setDraft((prev) => ({ ...prev, region }))}
          />
          <ComboboxField label="Species" placeholder="Select species" {...NO_OPTIONS} />
          <CheckboxField label="Size" options={SIZE_OPTIONS} />
          <CheckboxField label="Seafloor depth and topography" options={DEPTH_OPTIONS} />
        </div>

        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="ghost"
            className={BUTTON_CLASSES}
            onClick={() => setDraft(AREA_FILTER_DEFAULTS)}
          >
            Clear
          </Button>
          <Button
            type="button"
            className={cn(BUTTON_CLASSES, "shadow-none")}
            onClick={() => {
              applyFilters(draft);
              setOpen(false);
            }}
          >
            Apply Filters
          </Button>
        </div>

        <DialogClose className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full border border-slate-300 text-slate-700 transition-colors hover:bg-slate-100 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none">
          <XIcon className="size-4" />
          <span className="sr-only">Close</span>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
