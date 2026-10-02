import { useEffect, useId, useRef } from "react";
import { useAtom, useAtomValue } from "jotai";
import { LucideInfo, LucideLayers, LucideX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useSidebar } from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";
import { CONTEXTUAL_LAYER_GROUPS, CONTEXTUAL_LAYERS } from "@/lib/contextual-layers";
import { cn } from "@/lib/utils";
import { contextualLayersPanelOpenAtom, useContextualLayers } from "@/store";

// Keeps the sidebar's collapse toggle on the open panel's edge: the panel starts where the
// sidebar ends in both sidebar states, and the offset must match its `w-100`.
const SIDEBAR_TOGGLE_OVER_PANEL =
  "duration-200 ease-linear translate-x-[calc(100%+25rem)] group-data-[collapsible=offcanvas]:translate-x-[calc(100%+25rem)]";

export const useSidebarToggleClassName = () =>
  useAtomValue(contextualLayersPanelOpenAtom)
    ? SIDEBAR_TOGGLE_OVER_PANEL
    : "duration-200 ease-linear";

export function ContextualLayersPanel() {
  const [open, setOpen] = useAtom(contextualLayersPanelOpenAtom);
  const [visibleLayers, setLayerVisible] = useContextualLayers();
  const { state } = useSidebar();
  const panelId = useId();
  const headingId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const hasOpened = useRef(false);
  const collapsed = state === "collapsed";

  // The trigger goes inert under the open panel, so focus has to move with it.
  useEffect(() => {
    if (open) {
      hasOpened.current = true;
      closeRef.current?.focus();
    } else if (hasOpened.current) {
      triggerRef.current?.focus();
    }
  }, [open]);

  return (
    <>
      <Button
        ref={triggerRef}
        aria-expanded={open}
        aria-controls={panelId}
        inert={open}
        onClick={() => setOpen(true)}
        className={cn(
          "fixed top-4 z-4 hidden h-10 rounded-[4px] px-4 font-normal text-slate-700 shadow-none transition-[left,background-color] duration-200 ease-linear md:inline-flex",
          collapsed ? "left-[6.125rem]" : "left-[calc(6.125rem+var(--sidebar-width))]",
        )}
      >
        <LucideLayers aria-hidden />
        Contextual Layers
      </Button>

      {/* Stacked under the sidebar (z-10) so it slides out from behind it, and over the trigger. */}
      <section
        id={panelId}
        aria-labelledby={headingId}
        inert={!open}
        className={cn(
          "fixed inset-y-0 z-5 hidden w-100 flex-col gap-4 overflow-y-auto border-l border-slate-200 bg-slate-50 px-8 py-10 transition-[left,translate] duration-200 ease-linear md:flex",
          collapsed ? "left-[5.125rem]" : "left-[calc(5.125rem+var(--sidebar-width))]",
          !open && "-translate-x-full",
        )}
      >
        <header className="space-y-2">
          <div className="flex items-start justify-between gap-4">
            <h2 id={headingId} className="text-xl leading-7 font-semibold text-slate-700">
              Contextual layers
            </h2>
            <Button
              ref={closeRef}
              variant="ghost"
              size="icon"
              aria-label="Close contextual layers"
              onClick={() => setOpen(false)}
              className="-mt-1 -mr-2 size-9 rounded-full text-slate-700 hover:bg-slate-200"
            >
              <LucideX aria-hidden />
            </Button>
          </div>
          <p className="text-sm text-slate-400">
            Show or hide the layers drawn on the map. Your selection is kept in the link, so shared
            maps open with the same layers.
          </p>
        </header>

        <div className="flex flex-col gap-2">
          {CONTEXTUAL_LAYER_GROUPS.map((group, groupIndex) => {
            const isLastGroup = groupIndex === CONTEXTUAL_LAYER_GROUPS.length - 1;
            const layers = CONTEXTUAL_LAYERS.filter((layer) => layer.group === group.value);
            return (
              <fieldset
                key={group.value}
                className={cn("mt-4", !isLastGroup && "border-b border-slate-700 pb-2")}
              >
                <legend className="mb-2 text-xs leading-4 font-semibold tracking-[1.2px] text-slate-700 uppercase">
                  {group.label}
                </legend>
                <ul>
                  {layers.map(({ value, label, description }, layerIndex) => {
                    const switchId = `${panelId}-${group.value}-${value}`;
                    const hasDivider = isLastGroup || layerIndex < layers.length - 1;
                    return (
                      <li
                        key={value}
                        className={cn(
                          "flex items-start justify-between gap-4 py-2.5",
                          hasDivider && "border-b border-slate-200",
                        )}
                      >
                        <label
                          htmlFor={switchId}
                          className="flex min-h-6 flex-1 cursor-pointer items-center text-sm leading-4 text-slate-700"
                        >
                          {label}
                        </label>
                        <div className="flex items-center gap-2">
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                aria-label={`About ${label}`}
                                className="flex size-6 cursor-pointer items-center justify-center rounded-full text-slate-700 hover:bg-slate-200"
                              >
                                <LucideInfo className="size-4" aria-hidden />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent
                              side="top"
                              className="w-auto max-w-64 border-0 bg-white px-3 py-1.5 text-xs text-slate-600"
                            >
                              {description}
                            </PopoverContent>
                          </Popover>
                          <Switch
                            id={switchId}
                            checked={visibleLayers.includes(value)}
                            onCheckedChange={(checked) => setLayerVisible(value, checked)}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </fieldset>
            );
          })}
        </div>
      </section>
    </>
  );
}
