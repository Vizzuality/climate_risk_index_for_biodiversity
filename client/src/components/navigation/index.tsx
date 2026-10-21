import { cn } from "@/lib/utils";
import { LucideFish, LucideMapPinned } from "lucide-react";
import { Link } from "@tanstack/react-router";

const SECTIONS = [
  { to: "/areas", label: "Conservation Areas", Icon: LucideMapPinned },
  { to: "/species", label: "Species", Icon: LucideFish },
] as const;

export default function Navigation() {
  return (
    <div className="w-[5.125rem] bg-slate-200 h-full relative z-30 py-8 flex flex-col gap-8">
      <div className="flex justify-center">
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
                className="relative flex flex-col gap-1 items-center px-2 py-4"
                inactiveProps={{ className: "text-slate-700" }}
                activeProps={{
                  className:
                    "bg-foreground text-white after:absolute after:left-0 after:h-full after:bg-primary after:w-[3px] after:top-0",
                }}
              >
                <span aria-hidden="true" className="py-2">
                  <Icon className="size-6" />
                </span>
                <span className="overflow-wrap-anywhere break-word w-full text-center whitespace-normal text-xs font-medium tracking-tight">
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
