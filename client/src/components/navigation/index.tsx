import { cn } from "@/lib/utils";
import { LucideGrid2x2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { MapPinnedSolidIcon } from "./map-pinned-solid-icon";

const SECTIONS = [
  { to: "/areas", label: "Conservation Areas", Icon: MapPinnedSolidIcon },
  { to: "/species", label: "Species", Icon: LucideGrid2x2 },
] as const;

export default function Navigation() {
  return (
    <div className="w-[5.125rem] bg-slate-200 h-full relative z-30 pb-6 flex flex-col">
      <div className="flex h-31 items-center justify-center">
        <Link to="/">
          <img
            src="/crib-logo.svg"
            alt="Climate Risk Index for Biodiversity logo"
            width={26}
            height={36}
          />
        </Link>
      </div>
      <nav className={cn("bg-black-900 z-20 flex flex-col justify-between")}>
        <ul>
          {SECTIONS.map(({ to, label, Icon }) => (
            <li key={to}>
              <Link
                to={to}
                className="flex h-22 flex-col items-center justify-center gap-2 px-2 py-4"
                inactiveProps={{ className: "text-slate-700" }}
                activeProps={{ className: "bg-slate-700 text-white border-l-3 border-primary" }}
              >
                <Icon aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.2} />
                <span className="overflow-wrap-anywhere break-word w-full text-center whitespace-normal text-[10px] leading-3 font-medium tracking-[0.4px]">
                  {label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
