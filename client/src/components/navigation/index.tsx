"use client";

import { cn } from "@/lib/utils";
import { LucideMapPinned } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function Navigation() {
  return (
    <div className="w-[5.125rem] bg-slate-200 h-full relative z-30 py-8 flex flex-col gap-8">
      <div className="flex justify-center">
        <Link href="/">
          <Image
            src="/crib-logo.svg"
            alt="Climate Risk Index for Biodiversity logo"
            width={26}
            height={36}
            priority
          />
        </Link>
      </div>
      <nav className={cn("bg-black-900 z-20 flex flex-col justify-between")}>
        <ul>
          <Link
            href="/"
            className="bg-foreground relative flex flex-col gap-1 items-center px-2 py-4 after:absolute after:left-0 after:h-full after:bg-primary after:w-[3px] after:top-0"
          >
            <>
              <span aria-hidden="true" className="py-2">
                <LucideMapPinned className="size-6 text-white" />
              </span>
              <span className="overflow-wrap-anywhere break-word w-full text-center whitespace-normal text-white text-xs font-medium tracking-tight">
                Conservation Areas
              </span>
            </>
          </Link>
        </ul>
      </nav>
    </div>
  );
}
