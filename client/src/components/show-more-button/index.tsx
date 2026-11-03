import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

type ShowMoreButtonProps = Readonly<
  Omit<React.ComponentProps<"button">, "type" | "aria-expanded"> & { expanded: boolean }
>;

export function ShowMoreButton({ expanded, className, children, ...props }: ShowMoreButtonProps) {
  return (
    <button
      type="button"
      aria-expanded={expanded}
      className={cn(
        "inline-flex shrink-0 cursor-pointer items-center gap-1 text-xs tracking-[0.24px] text-slate-700 hover:text-slate-900",
        className,
      )}
      {...props}
    >
      <span className="border-b-[1.5px] border-current">{children}</span>
      <ChevronDown
        aria-hidden
        className={cn("size-4 transition-transform", expanded && "rotate-180")}
      />
    </button>
  );
}
